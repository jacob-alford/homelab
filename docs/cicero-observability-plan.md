# Plan: Observability on Cicero (Remote Agent)

## Goal

Run Alloy (log shipping) and Prometheus node_exporter (metrics) on Cicero, sending data to the existing observability stack on Augustus. The result: Cicero's systemd journal logs appear in Grafana via Loki, and Cicero's system metrics appear in Grafana via Prometheus.

## Current State

- **Augustus**: Full observability stack (Prometheus, Loki, Alloy, Grafana) running on localhost, all bound to `127.0.0.1`
- **Cicero**: Runs only step-ca (bound to `0.0.0.0:443`). Connected to Augustus via Tailscale
- **Loki on Augustus**: Listens on `127.0.0.1:3100` — not reachable from Cicero
- **Prometheus on Augustus**: Listens on `127.0.0.1:9090` — cannot scrape remote targets without network exposure

## Constraints

- **Port 443 on Cicero is occupied by step-ca** and cannot be proxied (step-ca requires domain matching on its own TLS listener)
- **Caddy on Cicero must use port 8443** for HTTPS instead of the default 443
- **Client certificates** for mTLS will be obtained via NixOS ACME (`security.acme.certs`) from the local step-ca instance using the `http` provisioner (http-01 challenge)
- Step-ca's default template includes both `serverAuth` and `clientAuth` EKU, so ACME-issued certs are valid for mTLS client presentation
- **No failure-notifs on Cicero** — Grafana alerting (via Apprise) covers failure monitoring

## Architecture

```
┌─────────────────────────────────────────────┐         ┌──────────────────────────────────────────┐
│               Cicero                         │         │              Augustus                     │
│                                              │         │                                           │
│  step-ca (:443, bound to 0.0.0.0)           │         │                                           │
│                                              │         │                                           │
│  Caddy (:8443 HTTPS, :80 HTTP)              │         │                                           │
│    ├─ mTLS vhost for node_exporter          │         │                                           │
│    └─ http:// vhost for ACME challenges     │         │                                           │
│                                              │         │                                           │
│  systemd journal ──▶ Alloy                   │         │                                           │
│                       │                      │  mTLS   │  Caddy ──▶ Loki :3100                     │
│                       └──push (8443)─────────┼────────▶│  (loki-push.plato-splunk.media)           │
│                                              │         │                                           │
│  node_exporter :9100                         │         │                                           │
│       ▲                                      │  mTLS   │  Prometheus                               │
│       └─ Caddy mTLS (:8443) ◀───────────────┼─────────┤    scrapes cicero-metrics:8443            │
│                                              │         │    (uses ACME client cert)                │
│                                              │         │                                           │
│  NixOS ACME ──▶ step-ca (localhost:443)      │         │  NixOS ACME ──▶ step-ca (ca.plato-...)    │
│    issues: cicero-metrics.plato-splunk.media  │         │    issues: prometheus-client.plato-...    │
│    (server cert for Caddy + client cert      │         │    (client cert for Prometheus scraper)   │
│     for Alloy to push to Augustus)           │         │                                           │
└─────────────────────────────────────────────┘         └──────────────────────────────────────────┘
                         Tailscale Network
```

---

## File Structure

```
nix-config/modules/features/cicero-observability/
├── complete.nix          # Composes all sub-modules into nixos.cicero-observability
├── acme.nix              # ACME cert provisioning from local step-ca
├── caddy.nix             # Caddy on port 8443 with mTLS vhost for metrics
├── node-exporter.nix     # Prometheus node_exporter (localhost-only)
└── alloy.nix             # Alloy shipping journal logs to Augustus' Loki
```

Changes on Augustus (existing modules):

- `nix-config/modules/services/loki.nix` — add mTLS Caddy vhost for push ingestion
- `nix-config/modules/services/prometheus.nix` — add ACME client cert + remote scrape job

---

## Implementation Steps

### Step 1: Add Service Registry Entries

**File:** `nix-config/modules/service-registry.nix`

Add to `config.constants.services`:

```nix
loki-push = {
  subdomain = "loki-push";
  domain = mkDomain "loki-push";
  url = mkUrl "loki-push";
};

cicero-metrics = {
  subdomain = "cicero-metrics";
  domain = mkDomain "cicero-metrics";
  url = mkUrl "cicero-metrics";
  port = 8443;  # Non-standard HTTPS port (443 taken by step-ca)
  acmePort = 22479;
};

prometheus-client = {
  # Domain for the client cert Augustus' Prometheus uses to scrape remote targets
  subdomain = "prometheus-client";
  domain = mkDomain "prometheus-client";
  acmePort = 22480;
};
```

---

### Step 2: Expose Loki Push Endpoint on Augustus (Caddy mTLS)

**File:** `nix-config/modules/services/loki.nix`

Add a Caddy virtualHost for Loki push ingestion, guarded by mTLS:

```nix
# External push ingestion endpoint (mTLS-guarded, for remote Alloy instances)
services.caddy.virtualHosts."${c.services.loki-push.url}" = {
  extraConfig = ''
    tls {
      client_auth {
        mode require_and_verify
        trust_pool file {
          pem_file ${c.ca.rootCert}
        }
      }
    }
    reverse_proxy 127.0.0.1:${builtins.toString svc.port}
  '';
};
```

This allows remote Alloy instances to `POST /loki/api/v1/push` to Augustus, authenticated by client certificate issued by our internal CA (regardless of whether it's a "server" or "client" cert — step-ca's default template includes both EKUs).

---

### Step 3: Prometheus Client Certificate on Augustus (NixOS ACME)

**File:** `nix-config/modules/services/prometheus.nix`

Augustus' Prometheus needs a client cert to present when scraping Cicero's mTLS-guarded metrics endpoint. We use NixOS ACME to obtain and auto-renew this cert from step-ca:

```nix
# Client certificate for Prometheus to use when scraping mTLS-guarded remote targets
security.acme.certs."${c.services.prometheus-client.domain}" = {
  domain = c.services.prometheus-client.domain;
  listenHTTP = "127.0.0.1:${builtins.toString c.services.prometheus-client.acmePort}";
  server = c.ca.acmeDirectoryHttp;
  group = "prometheus";
  reloadServices = [ "prometheus.service" ];
};

# Caddy vhost to serve ACME http-01 challenge for the client cert domain
services.caddy.virtualHosts."http://${c.services.prometheus-client.domain}" = {
  extraConfig = ''
    reverse_proxy localhost:${builtins.toString c.services.prometheus-client.acmePort}
  '';
};
```

Then add the remote scrape config:

```nix
{
  job_name = "cicero-node";
  scheme = "https";
  tls_config = {
    ca_file = toString c.ca.rootCert;
    cert_file = "${config.security.acme.certs."${c.services.prometheus-client.domain}".directory}/fullchain.pem";
    key_file = "${config.security.acme.certs."${c.services.prometheus-client.domain}".directory}/key.pem";
    server_name = c.services.cicero-metrics.domain;
  };
  static_configs = [
    {
      targets = [ "${c.services.cicero-metrics.domain}:${toString c.services.cicero-metrics.port}" ];
      labels = {
        instance = "cicero";
      };
    }
  ];
  metrics_path = "/metrics";
}
```

And add `prometheus` user to the ACME cert's group so it can read the key:

```nix
users.groups.prometheus = { };
users.users.prometheus = {
  isSystemUser = true;
  group = "prometheus";
};
```

(Note: NixOS Prometheus module may already create this user — verify and only add if needed.)

---

### Step 4: Create Feature — `cicero-observability`

Structure mirrors existing features like `homelab-api/`:

```
nix-config/modules/features/cicero-observability/
├── complete.nix
├── acme.nix
├── caddy.nix
├── node-exporter.nix
└── alloy.nix
```

---

#### `complete.nix`

```nix
{ inputs, ... }:
{
  flake.modules.nixos.cicero-observability = {
    imports = with inputs.self.modules.nixos; [
      cicero-observability-acme
      cicero-observability-caddy
      cicero-observability-node-exporter
      cicero-observability-alloy
    ];
  };
}
```

---

#### `acme.nix`

ACME cert provisioning from the local step-ca. One cert serves as both Caddy's server cert and Alloy's mTLS client cert (step-ca default template includes both `serverAuth` and `clientAuth` EKU).

```nix
{ config, ... }:
let
  c = config.constants;
  ciceroMetrics = c.services.cicero-metrics;
in
{
  flake.modules.nixos.cicero-observability-acme =
    { config, lib, ... }:
    {
      security.acme = {
        acceptTerms = true;
        defaults.email = c.acme.email;
      };

      security.acme.certs."${ciceroMetrics.domain}" = {
        domain = ciceroMetrics.domain;
        listenHTTP = "127.0.0.1:${builtins.toString ciceroMetrics.acmePort}";
        server = c.ca.acmeDirectoryHttp;
        group = "caddy";
        reloadServices = [
          "caddy.service"
          "alloy.service"
        ];
      };
    };
}
```

---

#### `caddy.nix`

Caddy on port 8443 (443 is occupied by step-ca). Serves the mTLS-guarded metrics endpoint and the HTTP vhost for ACME challenge validation.

```nix
{ config, ... }:
let
  c = config.constants;
  ciceroMetrics = c.services.cicero-metrics;
in
{
  flake.modules.nixos.cicero-observability-caddy =
    { config, lib, ... }:
    let
      inherit (config.security.acme.certs."${ciceroMetrics.domain}") directory;
    in
    {
      services.caddy = {
        enable = true;
        globalConfig = ''
          https_port 8443
        '';
      };

      # HTTP vhost on port 80 to serve ACME http-01 challenges
      # step-ca connects to http://<domain>:80/.well-known/acme-challenge/...
      services.caddy.virtualHosts."http://${ciceroMetrics.domain}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString ciceroMetrics.acmePort}
        '';
      };

      # mTLS-guarded metrics endpoint (node_exporter)
      services.caddy.virtualHosts."https://${ciceroMetrics.domain}:${toString ciceroMetrics.port}" = {
        extraConfig = ''
          tls ${directory}/fullchain.pem ${directory}/key.pem {
            client_auth {
              mode require_and_verify
              trust_pool file {
                pem_file ${c.ca.rootCert}
              }
            }
          }
          reverse_proxy 127.0.0.1:9100
        '';
      };
    };
}
```

---

#### `node-exporter.nix`

Prometheus node_exporter bound to localhost. Caddy fronts it with mTLS.

```nix
{ config, ... }:
{
  flake.modules.nixos.cicero-observability-node-exporter =
    { ... }:
    {
      services.prometheus.exporters.node = {
        enable = true;
        port = 9100;
        listenAddress = "127.0.0.1";
        enabledCollectors = [
          "systemd"
          "processes"
        ];
      };
    };
}
```

---

#### `alloy.nix`

Alloy ships systemd journal logs to Augustus' Loki via mTLS. Uses the same ACME cert as Caddy for client authentication.

```nix
{ config, ... }:
let
  c = config.constants;
  alloySvc = c.services.alloy;
  lokiPush = c.services.loki-push;
  ciceroMetrics = c.services.cicero-metrics;
in
{
  flake.modules.nixos.cicero-observability-alloy =
    { config, lib, ... }:
    let
      inherit (config.security.acme.certs."${ciceroMetrics.domain}") directory;
    in
    {
      services.alloy = {
        enable = true;
        extraFlags = [
          "--server.http.listen-addr=127.0.0.1:${toString alloySvc.port}"
        ];
      };

      environment.etc."alloy/config.alloy".text = ''
        // Discover all systemd journal entries
        loki.source.journal "systemd" {
          relabel_rules = loki.relabel.journal.rules
          forward_to    = [loki.write.remote.receiver]
          max_age       = "12h"
        }

        // Relabel rules to extract useful metadata
        loki.relabel "journal" {
          forward_to = []

          rule {
            source_labels = ["__journal__systemd_unit"]
            target_label  = "unit"
          }

          rule {
            source_labels = ["__journal__hostname"]
            target_label  = "hostname"
          }

          rule {
            source_labels = ["__journal_priority_keyword"]
            target_label  = "level"
          }

          rule {
            source_labels = ["__journal_container_name"]
            target_label  = "container"
          }

          rule {
            source_labels = ["__journal__transport"]
            target_label  = "transport"
          }
        }

        // Push logs to Augustus' Loki via mTLS
        loki.write "remote" {
          endpoint {
            url = "${lokiPush.url}/loki/api/v1/push"

            tls_config {
              ca_file     = "${c.ca.rootCert}"
              cert_file   = "${directory}/fullchain.pem"
              key_file    = "${directory}/key.pem"
            }
          }
        }
      '';

      # Alloy needs journal access + cert access
      systemd.services.alloy.serviceConfig = {
        SupplementaryGroups = [ "systemd-journal" "caddy" ];
      };

      # Ensure Alloy starts after cert is available
      systemd.services.alloy.after = [ "acme-${ciceroMetrics.domain}.service" ];
      systemd.services.alloy.wants = [ "acme-${ciceroMetrics.domain}.service" ];
    };
}
```

---

### Key Design Decisions

- **Feature structure**: Split into focused files (acme, caddy, node-exporter, alloy) composed via `complete.nix`, matching the `homelab-api` pattern.
- **Single ACME cert for both server and client use**: Step-ca's default template issues certs with both `serverAuth` and `clientAuth` EKU. One cert (`cicero-metrics.plato-splunk.media`) is used by Caddy as a server cert AND by Alloy as a client cert for pushing to Augustus.
- **Port 8443**: Since step-ca occupies 443, Caddy uses `https_port 8443` globally. All HTTPS vhosts on Cicero are served on 8443.
- **Port 80 for ACME challenges**: Caddy listens on port 80 (HTTP) to serve http-01 ACME challenges. Step-ca (on the same host) connects to `http://cicero-metrics.plato-splunk.media:80/.well-known/acme-challenge/...` to validate.
- **Short-lived certs (48h default, auto-renewed)**: The `http` provisioner has `defaultTLSCertDuration = "48h"`. NixOS ACME renews automatically before expiry.
- **Cert group = caddy**: Caddy and Alloy both need to read the cert. Alloy gets access via `SupplementaryGroups = ["caddy"]`.
- **No failure-notifs**: Grafana alerting (via Apprise webhook) replaces the need for per-host failure-notifs on Cicero.

---

### Step 5: Update Cicero Firewall

**File:** `nix-config/modules/_private/cicero/security.nix`

Add port 80 and 8443 to Tailscale interface:

```nix
networking.firewall = {
  enable = true;

  interfaces = {
    tailscale0 = {
      allowedTCPPorts = [
        22
        80     # ACME http-01 challenges (step-ca validates here)
        443    # step-ca
        8443   # Caddy HTTPS (mTLS metrics, etc.)
      ];
    };
  };
};
```

---

### Step 6: Register Feature in Cicero Host

**File:** `nix-config/modules/hosts/cicero.nix`

Add to the modules list:

```nix
nixos.cicero-observability
```

Full updated modules:

```nix
modules = [
  inputs.home-manager.nixosModules.home-manager
  inputs.nixvim.nixosModules.nixvim
  inputs.sops-nix.nixosModules.sops

  nixos.system-base
  nixos.step-ca
  nixos.cicero-observability   # <-- new

  ./../_private/cicero/hardware.nix
  ./../_private/cicero/security.nix
  ./../_private/cicero/users.nix
  ./../_private/cicero/sops.nix
  ./../_private/cicero/system.nix
  ./../_private/cicero/programs.nix

  { networking.hostName = "cicero"; }
];
```

Note: The `complete.nix` module imports all sub-modules (`cicero-observability-acme`, `cicero-observability-caddy`, `cicero-observability-node-exporter`, `cicero-observability-alloy`), so the host only needs the single composite module.

---

### Step 7: DNS

Ensure these domains resolve:

| Domain                                 | Resolves to            | Purpose                                             |
| -------------------------------------- | ---------------------- | --------------------------------------------------- |
| `cicero-metrics.plato-splunk.media`    | Cicero's Tailscale IP  | Prometheus scrapes here; ACME challenge served here |
| `loki-push.plato-splunk.media`         | Augustus' Tailscale IP | Alloy pushes logs here                              |
| `prometheus-client.plato-splunk.media` | Augustus' Tailscale IP | ACME challenge for Prometheus' client cert          |

If using a wildcard `*.plato-splunk.media` DNS record pointing to Augustus, you'll need an explicit override for `cicero-metrics.plato-splunk.media` → Cicero's Tailscale IP.

Additionally, on Cicero itself, `cicero-metrics.plato-splunk.media` needs to resolve to `127.0.0.1` so step-ca can reach the ACME challenge locally:

**File:** `nix-config/modules/_private/cicero/system.nix`

```nix
networking.hosts = {
  "127.0.0.1" = [
    "ca.plato-splunk.media"
    "cicero-metrics.plato-splunk.media"  # <-- add
  ];
};
```

---

## Security Model

| Path                                               | Auth                                         | Direction         | Port |
| -------------------------------------------------- | -------------------------------------------- | ----------------- | ---- |
| Cicero Alloy → Augustus Loki (Caddy)               | mTLS client cert (ACME-issued, 48h lifetime) | Push              | 443  |
| Augustus Prometheus → Cicero node_exporter (Caddy) | mTLS client cert (ACME-issued, 48h lifetime) | Pull (scrape)     | 8443 |
| Step-ca → Cicero Caddy (ACME challenge)            | None (http-01, token-based)                  | Local (127.0.0.1) | 80   |
| Step-ca → Augustus Caddy (ACME challenge)          | None (http-01, token-based)                  | Local (127.0.0.1) | 80   |

All cross-host traffic traverses Tailscale (WireGuard encrypted). mTLS provides application-layer authentication — only certs issued by our internal CA are accepted. Certs are short-lived (48h) and automatically renewed.

---

## Implementation Order

1. **Service registry entries** (Step 1) — no runtime effect
2. **DNS** (Step 7) — set up resolution before services depend on it
3. **Augustus: Loki push Caddy vhost** (Step 2) — exposes ingestion endpoint
4. **Augustus: Prometheus client cert + remote scrape** (Step 3) — will fail gracefully until Cicero is ready
5. **Cicero: Observability module** (Step 4) — the main work
6. **Cicero: Firewall** (Step 5) — opens ports for new services
7. **Cicero: Host registration** (Step 6) — wires it all together
8. **Deploy Augustus** — new endpoints go live
9. **Deploy Cicero** — data starts flowing
10. **Verify** — check Grafana dashboards

---

## Verification

1. **Cicero ACME cert issued:**
   ```sh
   # On Cicero
   sudo cat /var/lib/acme/cicero-metrics.plato-splunk.media/fullchain.pem | openssl x509 -text -noout
   # Verify: Subject CN = cicero-metrics.plato-splunk.media
   # Verify: X509v3 Extended Key Usage: TLS Web Server Authentication, TLS Web Client Authentication
   ```

2. **Cicero node_exporter via mTLS:**
   ```sh
   # From Augustus (with a valid client cert)
   curl --cert /path/to/cert.pem --key /path/to/key.pem \
     --cacert /path/to/alford-root.crt \
     https://cicero-metrics.plato-splunk.media:8443/metrics
   ```

3. **Cicero mTLS rejects unauthenticated:**
   ```sh
   # Should fail with TLS error
   curl --cacert /path/to/alford-root.crt \
     https://cicero-metrics.plato-splunk.media:8443/metrics
   ```

4. **Prometheus scraping Cicero:**
   Open Prometheus UI → Status → Targets → `cicero-node` job should show as UP

5. **Loki receiving Cicero logs:**
   Open Grafana → Explore → Loki → Query `{hostname="cicero"}` → should show journal entries

6. **Alloy pushing successfully:**
   ```sh
   # On Cicero
   journalctl -u alloy --since "5 minutes ago" | grep -i "loki\|error\|push"
   ```

---

## Checklist

- [ ] Add `loki-push`, `cicero-metrics`, `prometheus-client` to `service-registry.nix`
- [ ] Add mTLS Caddy vhost for `loki-push.plato-splunk.media` in Augustus' `loki.nix`
- [ ] Add ACME cert for `prometheus-client.plato-splunk.media` in Augustus' `prometheus.nix`
- [ ] Add Caddy http:// vhost for prometheus-client ACME challenge in Augustus' `prometheus.nix`
- [ ] Add `cicero-node` scrape job (with ACME client cert paths) to Augustus' `prometheus.nix`
- [ ] Create `nix-config/modules/features/cicero-observability/complete.nix`
- [ ] Create `nix-config/modules/features/cicero-observability/acme.nix`
- [ ] Create `nix-config/modules/features/cicero-observability/caddy.nix`
- [ ] Create `nix-config/modules/features/cicero-observability/node-exporter.nix`
- [ ] Create `nix-config/modules/features/cicero-observability/alloy.nix`
- [ ] Add `nixos.cicero-observability` to `nix-config/modules/hosts/cicero.nix`
- [ ] Update `networking.hosts` in `nix-config/modules/_private/cicero/system.nix`
- [ ] Update firewall in `nix-config/modules/_private/cicero/security.nix` (add ports 80, 8443)
- [ ] Ensure DNS for `cicero-metrics.plato-splunk.media` → Cicero Tailscale IP
- [ ] Ensure DNS for `loki-push.plato-splunk.media` → Augustus Tailscale IP
- [ ] Ensure DNS for `prometheus-client.plato-splunk.media` → Augustus Tailscale IP
- [ ] Build Augustus: `nix build .#nixosConfigurations.augustus.config.system.build.toplevel`
- [ ] Build Cicero: `nix build .#nixosConfigurations.cicero.config.system.build.toplevel`
- [ ] Deploy to Augustus
- [ ] Deploy to Cicero
- [ ] Verify ACME cert issued on Cicero (check EKU includes clientAuth)
- [ ] Verify Prometheus target `cicero-node` is UP
- [ ] Verify Loki has logs with `hostname="cicero"`
- [ ] Verify mTLS rejects unauthenticated requests on both endpoints

---

## Open Questions

1. **ACME on Cicero — does Caddy's `http_port` need explicit config?** If Caddy's `https_port` is set to 8443, its default `http_port` should remain 80. Verify Caddy doesn't auto-redirect HTTP to HTTPS on port 8443 for the challenge vhost.

2. **Prometheus user group access**: NixOS's Prometheus module creates its own user. We need to verify the Prometheus user can read the ACME cert files (group = "prometheus" on the ACME cert should suffice).

3. **Alloy restart on cert renewal**: The `reloadServices = ["alloy.service"]` in the ACME cert config will restart Alloy when the cert renews. Verify Alloy picks up the new cert without issues (brief log gap during restart is acceptable).
