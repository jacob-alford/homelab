# Plan: Observability Stack on Augustus

## Overview

Deploy a full observability stack on Augustus using NixOS native services:

- **Prometheus** — metrics collection and alerting rules
- **Grafana Loki** — log aggregation
- **Grafana Alloy** — log scraping from systemd journal (all services + podman containers)
- **Grafana** — dashboards, visualization, and alert routing to Apprise

All components are declaratively configured via NixOS modules. Authentication is handled via OIDC (Kanidm) for Grafana, and mTLS for Prometheus (which lacks OIDC support).

## Service Details

| Service    | NixOS Option          | Port  | URL                                     | Auth |
| ---------- | --------------------- | ----- | --------------------------------------- | ---- |
| Prometheus | `services.prometheus` | 9090  | `https://prometheus.plato-splunk.media` | mTLS |
| Loki       | `services.loki`       | 3100  | localhost only (no external access)     | none |
| Alloy      | `services.alloy`      | 12345 | localhost only (no external access)     | none |
| Grafana    | `services.grafana`    | 3000  | `https://grafana.plato-splunk.media`    | OIDC |

Loki and Alloy are internal-only — they listen on localhost and are accessed exclusively by Grafana and Alloy respectively. No Caddy vhost or external authentication is needed for them.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Augustus                          │
│                                                          │
│  systemd services ──journal──▶ Alloy ──push──▶ Loki     │
│  podman containers ─┘                            │      │
│                                                  ▼      │
│  node_exporter ──────scrape──▶ Prometheus    Grafana    │
│  systemd metrics ────┘              │           │       │
│                                     ▼           ▼       │
│                              AlertManager   Apprise     │
│                              (built-in)    (webhook)    │
│                                                          │
│  Caddy ─── mTLS ──▶ Prometheus :9090                    │
│  Caddy ─── OIDC ──▶ Grafana :3000                       │
└─────────────────────────────────────────────────────────┘
```

**Data flow:**

1. Alloy reads the systemd journal (all units including podman-* containers) and pushes logs to Loki
2. Prometheus scrapes metrics from node_exporter and itself
3. Grafana queries both Prometheus and Loki as data sources
4. Prometheus alerting rules fire to Alertmanager, which webhooks to Apprise
5. Grafana alert rules can also fire directly to Apprise via a webhook contact point

---

## Step 1: Register in Service Registry

**File:** `nix-config/modules/service-registry.nix`

Add to `config.constants.services`:

```nix
prometheus = {
  subdomain = "prometheus";
  domain = mkDomain "prometheus";
  url = mkUrl "prometheus";
  port = 9090;
  stateDir = "/var/lib/prometheus2";
};

loki = {
  port = 3100;
  stateDir = "/var/lib/loki";
};

alloy = {
  port = 12345;
};

grafana = {
  subdomain = "grafana";
  domain = mkDomain "grafana";
  url = mkUrl "grafana";
  clientId = "grafana";
  port = 3000;
  stateDir = "/var/lib/grafana";
};
```

---

## Step 2: Kanidm OIDC Provisioning for Grafana

**File:** `nix-config/modules/services/kanidm.nix`

Add groups:

```nix
"grafana.access" = { };
"grafana.admins" = { };
```

Add group memberships to relevant persons (jacob, rae):

```nix
jacob.groups = [
  # ... existing ...
  "grafana.access"
  "grafana.admins"
];
rae.groups = [
  # ... existing ...
  "grafana.access"
  "grafana.admins"
];
```

The OAuth2 client registration will be declared in the Grafana service module (Step 4).

---

## Step 3: Create Prometheus Module

**File:** `nix-config/modules/services/prometheus.nix`

```nix
{ config, ... }:
let
  c = config.constants;
  svc = c.services.prometheus;
in
{
  flake.modules.nixos.prometheus =
    { config, lib, pkgs, ... }:
    {
      services.prometheus = {
        enable = true;
        port = svc.port;
        listenAddress = "127.0.0.1";
        stateDir = "prometheus2";
        retentionTime = "30d";

        globalConfig = {
          scrape_interval = "15s";
          evaluation_interval = "15s";
        };

        scrapeConfigs = [
          {
            job_name = "prometheus";
            static_configs = [
              { targets = [ "127.0.0.1:${toString svc.port}" ]; }
            ];
          }
          {
            job_name = "node";
            static_configs = [
              { targets = [ "127.0.0.1:${toString config.services.prometheus.exporters.node.port}" ]; }
            ];
          }
        ];

        exporters.node = {
          enable = true;
          port = 9100;
          listenAddress = "127.0.0.1";
          enabledCollectors = [
            "systemd"
            "processes"
          ];
        };

        alertmanagers = [
          {
            static_configs = [
              { targets = [ "127.0.0.1:9093" ]; }
            ];
          }
        ];

        alertmanager = {
          enable = true;
          port = 9093;
          listenAddress = "127.0.0.1";
          configuration = {
            route = {
              receiver = "apprise";
              group_wait = "30s";
              group_interval = "5m";
              repeat_interval = "4h";
            };
            receivers = [
              {
                name = "apprise";
                webhook_configs = [
                  {
                    url = "http://127.0.0.1:${toString c.services.apprise.port}/notify/systemd-failure";
                    send_resolved = true;
                  }
                ];
              }
            ];
          };
        };

        rules = [
          (builtins.toJSON {
            groups = [
              {
                name = "system";
                rules = [
                  {
                    alert = "HighCPUUsage";
                    expr = ''100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85'';
                    for = "5m";
                    labels.severity = "warning";
                    annotations.summary = "High CPU usage on {{ $labels.instance }}";
                  }
                  {
                    alert = "HighMemoryUsage";
                    expr = ''(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90'';
                    for = "5m";
                    labels.severity = "warning";
                    annotations.summary = "High memory usage on {{ $labels.instance }}";
                  }
                  {
                    alert = "DiskSpaceLow";
                    expr = ''(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 > 85'';
                    for = "5m";
                    labels.severity = "critical";
                    annotations.summary = "Disk space low on {{ $labels.instance }}";
                  }
                  {
                    alert = "SystemdUnitFailed";
                    expr = ''node_systemd_unit_state{state="failed"} == 1'';
                    for = "1m";
                    labels.severity = "critical";
                    annotations.summary = "Systemd unit {{ $labels.name }} has failed";
                  }
                ];
              }
            ];
          })
        ];
      };

      # Caddy reverse proxy with mTLS (Prometheus has no OIDC)
      services.caddy.virtualHosts."${svc.url}" = {
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

      services.failure-notifs.attachServices = [
        "prometheus"
        "alertmanager"
        "prometheus-node-exporter"
      ];
    };
}
```

### Key Decisions

- **mTLS for Prometheus UI**: Prometheus does not support OIDC. Access is guarded by Caddy mTLS client certificate verification, same pattern as Apprise.
- **Alertmanager built-in**: NixOS `services.prometheus.alertmanager` runs Alertmanager alongside Prometheus. Alerts webhook to Apprise's `/notify/systemd-failure` endpoint.
- **node_exporter with systemd collector**: Exports systemd unit states, enabling alerting on failed units via Prometheus (complementing the existing oneshot notification approach).
- **Localhost-only binding**: Both Prometheus and node_exporter bind to 127.0.0.1 only.
- **30-day retention**: Reasonable for a homelab; adjust if disk becomes a concern.

---

## Step 4: Create Loki Module

**File:** `nix-config/modules/services/loki.nix`

```nix
{ config, ... }:
let
  c = config.constants;
  svc = c.services.loki;
in
{
  flake.modules.nixos.loki =
    { config, lib, pkgs, ... }:
    {
      services.loki = {
        enable = true;
        configuration = {
          auth_enabled = false;

          server = {
            http_listen_port = svc.port;
            http_listen_address = "127.0.0.1";
            grpc_listen_port = 9096;
            grpc_listen_address = "127.0.0.1";
          };

          common = {
            path_prefix = svc.stateDir;
            replication_factor = 1;
            ring.kvstore.store = "inmemory";
            ring.instance_addr = "127.0.0.1";
          };

          schema_config.configs = [
            {
              from = "2024-01-01";
              store = "tsdb";
              object_store = "filesystem";
              schema = "v13";
              index = {
                prefix = "index_";
                period = "24h";
              };
            }
          ];

          storage_config.filesystem.directory = "${svc.stateDir}/chunks";

          limits_config = {
            retention_period = "30d";
            allow_structured_metadata = true;
            volume_enabled = true;
          };

          compactor = {
            working_directory = "${svc.stateDir}/compactor";
            delete_request_store = "filesystem";
            retention_enabled = true;
          };
        };
      };

      systemd.services.loki.serviceConfig = {
        DynamicUser = lib.mkForce false;
        User = "loki";
        Group = "loki";
        StateDirectory = "loki";
      };

      users.users.loki = {
        isSystemUser = true;
        group = "loki";
        home = svc.stateDir;
      };

      users.groups.loki = { };

      services.failure-notifs.attachServices = [ "loki" ];
    };
}
```

### Key Decisions

- **Single-node config**: `replication_factor = 1`, `inmemory` ring store. Appropriate for a single-host homelab.
- **TSDB + filesystem**: Modern schema (v13) with local filesystem storage. No object storage dependency.
- **30-day retention with compactor**: Matches Prometheus retention. Compactor runs deletion.
- **No external access**: Loki binds to localhost only. Only Grafana and Alloy communicate with it.
- **Static user**: Explicit `loki` user/group for clear filesystem ownership (overrides NixOS default `DynamicUser`).

---

## Step 5: Create Alloy Module

**File:** `nix-config/modules/services/alloy.nix`

```nix
{ config, ... }:
let
  c = config.constants;
  svc = c.services.alloy;
  lokiSvc = c.services.loki;
in
{
  flake.modules.nixos.alloy =
    { config, lib, pkgs, ... }:
    {
      services.alloy = {
        enable = true;
        extraFlags = [
          "--server.http.listen-addr=127.0.0.1:${toString svc.port}"
        ];
      };

      # Alloy configuration file
      environment.etc."alloy/config.alloy".text = ''
        // Discover all systemd journal entries (services + podman containers)
        loki.source.journal "systemd" {
          relabel_rules = loki.relabel.journal.rules
          forward_to    = [loki.write.local.receiver]
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

        // Push logs to local Loki instance
        loki.write "local" {
          endpoint {
            url = "http://127.0.0.1:${toString lokiSvc.port}/loki/api/v1/push"
          }
        }
      '';

      # Alloy needs access to the systemd journal
      systemd.services.alloy.serviceConfig = {
        SupplementaryGroups = [ "systemd-journal" ];
      };

      services.failure-notifs.attachServices = [ "alloy" ];
    };
}
```

### Key Decisions

- **Journal scraping**: Alloy reads the systemd journal directly, which captures all systemd services AND podman containers (since NixOS podman containers are systemd services like `podman-apprise.service`).
- **Relabel rules**: Extract `unit`, `hostname`, `level`, `container`, and `transport` labels for rich querying in Grafana.
- **max_age = 12h**: On restart, Alloy will backfill up to 12 hours of journal history.
- **No external access**: Alloy's HTTP UI binds to localhost only (for internal health checks/debugging).
- **systemd-journal group**: Alloy needs this supplementary group to read `/var/log/journal`.

---

## Step 6: Create Grafana Module

**File:** `nix-config/modules/services/grafana.nix`

```nix
{ config, ... }:
let
  c = config.constants;
  svc = c.services.grafana;
  promSvc = c.services.prometheus;
  lokiSvc = c.services.loki;
in
{
  flake.modules.nixos.grafana =
    { config, lib, pkgs, ... }:
    {
      # Kanidm OIDC client registration
      services.kanidm.provision.systems.oauth2."${svc.clientId}" = {
        originUrl = "${svc.url}/login/generic_oauth";
        originLanding = "${svc.url}/";
        displayName = "Grafana";

        basicSecretFile = config.sops.secrets.grafana_client_secret.path;

        scopeMaps."grafana.access" = [
          "openid"
          "email"
          "profile"
        ];

        claimMaps.roles = {
          joinType = "array";
          valuesByGroup = {
            "grafana.admins" = [ "admin" ];
            "grafana.access" = [ "editor" ];
          };
        };
      };

      services.grafana = {
        enable = true;

        settings = {
          server = {
            http_addr = "127.0.0.1";
            http_port = svc.port;
            domain = svc.domain;
            root_url = svc.url;
          };

          "auth.generic_oauth" = {
            enabled = true;
            name = "Kanidm";
            client_id = svc.clientId;
            client_secret = "$__file{${config.sops.secrets.grafana_client_secret.path}}";
            scopes = "openid email profile";
            auth_url = "https://${c.idm.domain}/ui/oauth2";
            token_url = "https://${c.idm.domain}/oauth2/token";
            api_url = "https://${c.idm.domain}/oauth2/openid/${svc.clientId}/userinfo";
            login_attribute_path = "preferred_username";
            role_attribute_path = "contains(roles[*], 'admin') && 'Admin' || 'Editor'";
            allow_sign_up = true;
            auto_login = true;
            use_pkce = true;
            tls_client_ca = c.ca.rootCert;
          };

          auth = {
            disable_login_form = true;
          };

          analytics = {
            reporting_enabled = false;
            check_for_updates = false;
            check_for_plugin_updates = false;
          };
        };

        provision = {
          enable = true;

          datasources.settings.datasources = [
            {
              name = "Prometheus";
              type = "prometheus";
              url = "http://127.0.0.1:${toString promSvc.port}";
              isDefault = true;
              access = "proxy";
            }
            {
              name = "Loki";
              type = "loki";
              url = "http://127.0.0.1:${toString lokiSvc.port}";
              access = "proxy";
            }
          ];

          alerting.contactPoints.settings.contactPoints = [
            {
              orgId = 1;
              name = "Apprise";
              receivers = [
                {
                  uid = "apprise-webhook";
                  type = "webhook";
                  settings = {
                    url = "http://127.0.0.1:${toString c.services.apprise.port}/notify/systemd-failure";
                    httpMethod = "POST";
                  };
                }
              ];
            }
          ];

          alerting.policies.settings.policies = [
            {
              orgId = 1;
              receiver = "Apprise";
            }
          ];
        };
      };

      # Caddy reverse proxy (OIDC handles auth)
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };

      services.failure-notifs.attachServices = [
        "grafana"
      ];
    };
}
```

### Key Decisions

- **OIDC via Kanidm**: Grafana natively supports generic OAuth2/OIDC. Login form is disabled; all auth goes through Kanidm.
- **Role mapping**: Kanidm groups map to Grafana roles — `grafana.admins` → Admin, `grafana.access` → Editor.
- **auto_login = true**: Users are immediately redirected to Kanidm; no Grafana login page.
- **use_pkce = true**: PKCE (S256) for OAuth code exchange, consistent with other services.
- **tls_client_ca**: Grafana needs to trust our internal CA to communicate with Kanidm over HTTPS.
- **Provisioned datasources**: Prometheus and Loki are pre-configured — no manual setup needed.
- **Provisioned alerting**: Apprise webhook is pre-configured as the default alert contact point.
- **No mTLS on Caddy**: Grafana has proper OIDC auth, so Caddy simply reverse proxies without client cert requirements.

---

## Step 7: Secrets (SOPS)

**File:** `nix-config/modules/_private/augustus/sops.nix`

Add:

```nix
sops.secrets.grafana_client_secret = {
  owner = "kanidm";
};
```

**Secrets to add to `nix-config/secrets/augustus.yaml`:**

| Key                     | Purpose                        |
| ----------------------- | ------------------------------ |
| `grafana_client_secret` | OIDC client secret for Grafana |

Generate:

```sh
openssl rand -base64 32 | tr -d '\n'
```

---

## Step 8: Register Modules in Augustus Host

**File:** `nix-config/modules/hosts/augustus.nix`

Add to the modules list:

```nix
nixos.prometheus
nixos.loki
nixos.alloy
nixos.grafana
```

---

## Step 9: Failure Notifications (Private Config)

**File:** `nix-config/modules/_private/augustus/system.nix`

No changes needed — each service module declares its own `services.failure-notifs.attachServices`. The list-type option merges automatically.

---

## Security Hardening Summary

| Concern                | Mitigation                                                        |
| ---------------------- | ----------------------------------------------------------------- |
| Prometheus web UI auth | mTLS client certificate via Caddy (same as Apprise)               |
| Grafana auth           | OIDC via Kanidm; login form disabled                              |
| Loki access            | Localhost-only; no external exposure                              |
| Alloy access           | Localhost-only; no external exposure                              |
| Alertmanager access    | Localhost-only; no external exposure                              |
| Service users          | Dedicated system users (`loki`, `prometheus`, `grafana`, `alloy`) |
| Network binding        | All services bind to `127.0.0.1` only                             |
| Privilege escalation   | NixOS service hardening (DynamicUser or explicit system user)     |
| Inter-service comms    | All on localhost; no network traversal                            |
| Secrets management     | SOPS-encrypted; secrets mounted with correct ownership            |
| Firewall               | No new ports opened; all traffic through Caddy on 443             |

---

## Log Aggregation Coverage

Alloy reads the systemd journal, which captures:

- All native systemd services (homelab-api, kanidm, postgresql, caddy, etc.)
- All podman containers (podman-apprise, podman-planka, podman-habitsync, etc.)
- System-level messages (kernel, systemd-init, networkd, resolved)
- User session services

No per-service configuration is needed — journal scraping is comprehensive by design.

---

## Alerting Architecture

Two complementary alerting paths:

### Path 1: Prometheus Alertmanager → Apprise

- **Trigger**: Prometheus alert rules (CPU, memory, disk, failed systemd units)
- **Route**: Prometheus evaluates rules → fires to Alertmanager → webhooks to Apprise → Pushover
- **Use for**: Infrastructure/resource alerts, systemd unit health

### Path 2: Grafana Alerting → Apprise

- **Trigger**: Grafana alert rules (can query both Prometheus and Loki)
- **Route**: Grafana evaluates rules → webhooks to Apprise → Pushover
- **Use for**: Log-based alerts (error rate spikes, specific log patterns), composite alerts

### Path 3: Existing failure-notifs (unchanged)

- **Trigger**: systemd `OnFailure=`
- **Route**: failure-notifs.service → curl Apprise → Pushover
- **Use for**: Immediate service crash notifications (faster than polling-based alerting)

All three paths coexist. The existing failure-notifs system provides instant crash alerts; Prometheus adds resource monitoring; Grafana adds log-based intelligence.

---

## Deployment & Verification

1. **Build:**
   ```sh
   nix build .#nixosConfigurations.augustus.config.system.build.toplevel
   ```

2. **Deploy:**
   ```sh
   nixos-rebuild switch --flake .#augustus
   ```

3. **Verify services are running:**
   ```sh
   systemctl status prometheus prometheus-node-exporter alertmanager loki alloy grafana
   ```

4. **Test Prometheus (with client cert):**
   ```sh
   curl --cert client.crt --key client.key --cacert ca.crt \
     https://prometheus.plato-splunk.media/-/healthy
   ```

5. **Test Grafana OIDC:**
   Navigate to `https://grafana.plato-splunk.media` — should redirect to Kanidm login.

6. **Verify Loki ingestion (via Grafana):**
   Open Grafana → Explore → Select Loki → Query `{unit="caddy.service"}` — should return logs.

7. **Verify Prometheus targets:**
   Open Prometheus UI → Status → Targets — should show `node` and `prometheus` as UP.

8. **Test alerting:**
   Trigger a test alert or temporarily lower a threshold to verify the Apprise webhook fires.

---

## Checklist

- [ ] Add `prometheus`, `loki`, `alloy`, `grafana` entries to `service-registry.nix`
- [ ] Add `grafana.access` and `grafana.admins` groups to Kanidm provisioning
- [ ] Add Grafana group memberships to persons (jacob, rae)
- [ ] Create `nix-config/modules/services/prometheus.nix`
- [ ] Create `nix-config/modules/services/loki.nix`
- [ ] Create `nix-config/modules/services/alloy.nix`
- [ ] Create `nix-config/modules/services/grafana.nix`
- [ ] Add `grafana_client_secret` to SOPS (`nix-config/secrets/augustus.yaml`)
- [ ] Add SOPS declaration to `nix-config/modules/_private/augustus/sops.nix`
- [ ] Add `nixos.prometheus`, `nixos.loki`, `nixos.alloy`, `nixos.grafana` to `nix-config/modules/hosts/augustus.nix`
- [ ] Build NixOS configuration
- [ ] Deploy to Augustus
- [ ] Verify all four services are running
- [ ] Verify Prometheus scrape targets are UP
- [ ] Verify Loki is receiving journal logs (query in Grafana)
- [ ] Verify Grafana OIDC login works
- [ ] Verify Prometheus mTLS rejects unauthenticated requests
- [ ] Test alert pipeline end-to-end (Prometheus → Alertmanager → Apprise → Pushover)
- [ ] Verify Grafana provisioned datasources are functional

---

## DNS

Ensure these domains resolve to Augustus (via Tailscale MagicDNS or wildcard DNS for `*.plato-splunk.media`):

- `prometheus.plato-splunk.media`
- `grafana.plato-splunk.media`

Loki and Alloy do not need DNS entries (localhost-only).

---

## Future Considerations

- **Additional exporters**: caddy-exporter, postgres-exporter, blackbox-exporter for endpoint probing
- **Grafana dashboards provisioning**: Declaratively provision JSON dashboard models via `services.grafana.provision.dashboards`
- **Multi-host scraping**: If expanding to cicero/praeconinus, add remote scrape targets and consider running Alloy on each host pushing to centralized Loki
- **Retention tuning**: Adjust retention based on actual disk usage after a few weeks
- **Restic backups**: Add backup jobs for Grafana state (dashboards, alert rules) and Loki data if desired
- **Loki structured metadata**: As services adopt structured logging, leverage Loki's structured metadata for richer queries
