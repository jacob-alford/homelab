# Plan: OpenTelemetry Tracing with Grafana Tempo on Augustus

## Overview

Deploy Grafana Tempo on Augustus as a local-only trace backend, receiving OTLP/gRPC traces from services that support OpenTelemetry. Traces are visualized through the existing Grafana instance. No authentication is needed since all traffic is localhost-only.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           Augustus                                │
│                                                                   │
│  homelab-api ──── OTLP/gRPC ────┐                                │
│  kanidm ──────── OTLP/gRPC ─────┤                                │
│  caddy ───────── OTLP/gRPC ─────┼──▶ Tempo :4317 (gRPC receiver) │
│                                  │                                │
│                                  │                                │
│  Grafana ◀── query ── Tempo :3200 (HTTP API)                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Data flow:**

1. Services send traces via OTLP/gRPC to `127.0.0.1:4317`
2. Tempo stores traces locally on the filesystem
3. Grafana queries Tempo at `http://127.0.0.1:3200` as a provisioned datasource
4. Traces can be correlated with existing Loki logs via trace IDs

---

## Port Allocation

Existing ports in use on Augustus (from service-registry.nix):

| Port  | Service           |
| ----- | ----------------- |
| 443   | step-ca           |
| 2019  | caddy admin       |
| 3000  | grafana           |
| 3100  | loki              |
| 5432  | postgres          |
| 6842  | habitsync         |
| 8123  | home-assistant    |
| 8443  | ca-metrics/cicero |
| 9090  | prometheus        |
| 9096  | loki gRPC         |
| 9100  | node_exporter     |
| 9187  | postgres_exporter |
| 11434 | ollama            |
| 12345 | alloy             |
| 19553 | openwebui         |
| 25565 | minecraft         |
| 35427 | homelab-api       |
| 47309 | it-tools          |
| 51571 | apprise           |

**Tempo ports (no conflicts):**

| Port | Protocol | Purpose                       |
| ---- | -------- | ----------------------------- |
| 3200 | HTTP     | Tempo query API (for Grafana) |
| 4317 | gRPC     | OTLP receiver (traces in)     |
| 9095 | gRPC     | Tempo internal gRPC server    |

All ports listen on `127.0.0.1` only.

---

## Step 1: Register in Service Registry

**File:** `nix-config/modules/service-registry.nix`

Add to `config.constants.services`:

```nix
tempo = {
  port = 3200;        # HTTP query API
  grpcPort = 4317;    # OTLP gRPC receiver
  stateDir = "/var/lib/tempo";
};
```

---

## Step 2: Create the Tempo Service Module

**File:** `nix-config/modules/services/tempo.nix`

```nix
{ config, ... }:
let
  c = config.constants;
  svc = c.services.tempo;
in
{
  flake.modules.nixos.tempo =
    { config, lib, pkgs, ... }:
    {
      services.tempo = {
        enable = true;
        settings = {
          server = {
            http_listen_port = svc.port;
            http_listen_address = "127.0.0.1";
            grpc_listen_port = 9095;
            grpc_listen_address = "127.0.0.1";
          };

          distributor = {
            receivers = {
              otlp = {
                protocols = {
                  grpc = {
                    endpoint = "127.0.0.1:${toString svc.grpcPort}";
                    # Kanidm startup can produce large spans
                    max_recv_msg_size_mib = 20;
                  };
                };
              };
            };
          };

          storage = {
            trace = {
              backend = "local";
              local = {
                path = "${svc.stateDir}/traces";
              };
              wal = {
                path = "${svc.stateDir}/wal";
              };
            };
          };

          compactor = {
            compaction = {
              block_retention = "72h"; # 3 days retention to start
            };
          };

          metrics_generator = {
            # Optional: generate span metrics for Prometheus
            # Disabled initially for simplicity
          };
        };
      };

      services.failure-notifs.attachServices = [ "tempo" ];
    };
}
```

### Key Configuration Decisions

- **Retention:** 72h (3 days) to start — tracing generates significant data volume. Can be extended once storage impact is understood.
- **max_recv_msg_size_mib:** Set to 20MB per Kanidm docs recommendation. Kanidm startup produces large initial spans that exceed the 5MB default.
- **Backend:** Local filesystem storage. No object storage needed at homelab scale.
- **No auth:** All listeners bound to `127.0.0.1` — no external access.

---

## Step 3: Register the Module in Augustus Host

**File:** `nix-config/modules/hosts/augustus.nix`

Add `nixos.tempo` to the modules list:

```nix
modules = [
  # ... existing modules
  nixos.tempo
  # ...
];
```

---

## Step 4: Add Tempo as a Grafana Datasource

**File:** `nix-config/modules/services/grafana.nix`

Add to `provision.datasources.settings.datasources`:

```nix
{
  name = "Tempo";
  type = "tempo";
  uid = "tempo";
  url = "http://127.0.0.1:${toString c.services.tempo.port}";
  access = "proxy";
  orgId = 1;
  jsonData = {
    tracesToLogsV2 = {
      datasourceUid = "loki";
      filterByTraceID = true;
      filterBySpanID = false;
      customQuery = false;
    };
    tracesToMetrics = {
      datasourceUid = "prometheus";
    };
    serviceMap = {
      datasourceUid = "prometheus";
    };
    nodeGraph = {
      enabled = true;
    };
    search = {
      hide = false;
    };
    traceQuery = {
      timeShiftEnabled = true;
      spanStartTimeShift = "-1h";
      spanEndTimeShift = "1h";
    };
  };
}
```

Also add Tempo to Grafana's systemd dependencies:

```nix
systemd.services.grafana = {
  after = [
    "prometheus.service"
    "loki.service"
    "tempo.service"     # <-- add
  ];
  requires = [
    "prometheus.service"
    "loki.service"
    "tempo.service"     # <-- add
  ];
};
```

---

## Step 5: Configure Services to Send Traces

### homelab-api

**File:** `nix-config/modules/features/homelab-api/systemd-service.nix`

Add to the `sops.templates."homelab-api-env"` content:

```nix
OTEL_GRPC_ENDPOINT_URL=http://127.0.0.1:${toString c.services.tempo.grpcPort}
```

The homelab-api already has OTel support built in; it just needs the endpoint URL.

### Kanidm

**File:** `nix-config/modules/services/kanidm.nix`

Add an environment variable to the kanidm systemd service:

```nix
systemd.services.kanidm.environment = {
  KANIDM_OTEL_GRPC_URL = "http://127.0.0.1:${toString c.services.tempo.grpcPort}";
};
```

Per Kanidm docs, the `KANIDM_OTEL_GRPC_URL` environment variable enables OTLP trace export via gRPC.

### Caddy (Augustus only)

Caddy (2.x, included in `pkgs-unstable.caddy`) has built-in OpenTelemetry tracing support via the `tracing` directive. It uses the OTEL environment variable specification for exporter configuration.

**Important:** The `caddy.nix` module is shared across Augustus, Cicero, and Praeconinus. The tracing environment variables and `tracing` directives must only be applied on Augustus — not on other hosts that lack a Tempo instance.

#### Approach: Augustus-specific Caddy tracing config

Since the shared `caddy.nix` module is loaded by all hosts that use Caddy, the OTEL environment variables should be set in the Augustus private system config rather than in the shared Caddy module.

**File:** `nix-config/modules/_private/augustus/system.nix`

```nix
systemd.services.caddy.environment = {
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = "http://127.0.0.1:${toString c.services.tempo.grpcPort}";
  OTEL_SERVICE_NAME = "caddy";
};
```

#### Caddy `tracing` directives — targeted vhosts

Add the `tracing` directive to these specific vhosts on Augustus:

| Vhost                                    | File                             | Span Name     | Reason                          |
| ---------------------------------------- | -------------------------------- | ------------- | ------------------------------- |
| `https://homelab-api.plato-splunk.media` | `features/homelab-api/caddy.nix` | `homelab-api` | API reverse proxy               |
| `http://homelab-api.plato-splunk.media`  | `features/homelab-api/caddy.nix` | `homelab-api` | Insecure API route              |
| `https://homelab.plato-splunk.media`     | `features/homelab-ui/caddy.nix`  | `homelab-ui`  | Frontend static site            |
| `https://idm.plato-splunk.media`         | `services/kanidm.nix`            | `kanidm`      | Kanidm HTTPS reverse proxy      |
| `https://prometheus.plato-splunk.media`  | `services/prometheus.nix`        | `prometheus`  | mTLS-guarded Prometheus         |
| `https://loki-push.plato-splunk.media`   | `services/loki.nix`              | `loki-push`   | mTLS-guarded Loki push endpoint |
| `https://apprise.plato-splunk.media`     | `services/apprise.nix`           | `apprise`     | mTLS-guarded Apprise            |

Example for `features/homelab-api/caddy.nix`:

```nix
services.caddy.virtualHosts."${svc.url}" = {
  extraConfig = ''
    tracing {
      span homelab-api
    }
    reverse_proxy 127.0.0.1:${builtins.toString svc.port}
  '';
};
```

Example for a mTLS vhost (`services/prometheus.nix`):

```nix
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
    tracing {
      span prometheus
    }
    reverse_proxy 127.0.0.1:${builtins.toString svc.port}
  '';
};
```

#### Why this is safe for other hosts

- The `tracing` directive in Caddy is a no-op if the OTEL exporter env vars are not set. If `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is unset, Caddy will not attempt to export spans.
- However, to be explicit and avoid any startup warnings, the `tracing` directives should only be added to vhost configs that are exclusively loaded on Augustus. Checking the module loading:
  - `features/homelab-api/caddy.nix` — loaded on both Augustus and Praeconinus via `nixos.homelab-api` (which includes the caddy submodule)
  - `features/homelab-ui/caddy.nix` — loaded only on Augustus
  - `services/kanidm.nix` — loaded only on Augustus
  - `services/prometheus.nix` — loaded only on Augustus
  - `services/loki.nix` — loaded only on Augustus
  - `services/apprise.nix` — loaded only on Augustus

For `homelab-api/caddy.nix` (shared with Praeconinus), gate the tracing directive behind an option:

```nix
{ config, lib, ... }:
let
  svc = config.constants.services.homelab;
  tracingEnabled = config.services.tempo.enable or false;
  tracingBlock = lib.optionalString tracingEnabled ''
    tracing {
      span homelab-api
    }
  '';
in
{
  flake.modules.nixos.homelab-api-caddy =
    { config, ... }:
    {
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          ${tracingBlock}
          reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };

      services.caddy.virtualHosts."${svc.insecureUrl}" = {
        extraConfig = ''
          ${tracingBlock}
          reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };
    };
}
```

This ensures Praeconinus (which does not have `services.tempo.enable = true`) won't include the tracing block.

---

## Step 6: Other Augustus Services — OTel Integration Assessment

| Service            | OTel Support? | Notes                                                                                            |
| ------------------ | ------------- | ------------------------------------------------------------------------------------------------ |
| **homelab-api**    | ✅ Yes        | Already implemented. Needs `OTEL_GRPC_ENDPOINT_URL` env var.                                     |
| **Kanidm**         | ✅ Yes        | Native support via `KANIDM_OTEL_GRPC_URL`. Documented above.                                     |
| **Caddy**          | ✅ Yes        | Built-in `tracing` directive using OTEL env vars for exporter config. gRPC export.               |
| **Grafana**        | ✅ Yes        | Supports OTEL tracing via `[tracing.opentelemetry.otlp]`. Not needed — low value for this setup. |
| **PostgreSQL**     | ❌ No         | No native OTLP support. Requires external instrumentation (e.g. pgotel extension or app-level).  |
| **Prometheus**     | ❌ No         | No trace export. Metrics-only by design.                                                         |
| **Loki**           | ❌ No         | Internal tracing exists but is for Loki development, not user-facing trace export.               |
| **Alloy**          | ⚠️ Partial     | Alloy can be an OTEL collector/forwarder, but not a trace _source_ in this context.              |
| **Home Assistant** | ❌ No         | No OpenTelemetry support. Community has requested it but it's not implemented.                   |
| **Open WebUI**     | ❌ No         | Python app, no built-in OTel. Could instrument with `opentelemetry-instrument` but low priority. |
| **Planka**         | ❌ No         | Node.js container, no native OTel. Could instrument but it's a third-party container.            |
| **HabitSync**      | ❌ No         | Spring Boot container. Could add OTel Java agent but it's third-party, low priority.             |
| **Minecraft**      | ❌ No         | No OTel support.                                                                                 |
| **Ollama**         | ❌ No         | No trace export.                                                                                 |

### Included in this plan (Phase 1)

- homelab-api (native)
- Kanidm (native)
- Caddy (built-in, selected vhosts on Augustus only)

### Not included

- **Grafana** — supports OTel tracing but low value for a homelab. Would only trace internal Grafana operations (dashboard loads, datasource queries). Omitted to avoid unnecessary storage.
- **Alloy** — could act as an OTEL collector pipeline (receive → batch → export to Tempo). For now, direct service → Tempo is simpler.

---

## Implementation Checklist

- [ ] Add `tempo` to `service-registry.nix` (port 3200, grpcPort 4317)
- [ ] Create `nix-config/modules/services/tempo.nix` with the module
- [ ] Add `nixos.tempo` to `nix-config/modules/hosts/augustus.nix`
- [ ] Add Tempo datasource to Grafana provisioning in `grafana.nix`
- [ ] Add Tempo to Grafana's systemd service dependencies
- [ ] Add `OTEL_GRPC_ENDPOINT_URL` to homelab-api env template in `systemd-service.nix`
- [ ] Add `KANIDM_OTEL_GRPC_URL` to kanidm systemd service environment
- [ ] Add Caddy OTEL env vars (`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_SERVICE_NAME`) in `_private/augustus/system.nix`
- [ ] Add `tracing` directive to `features/homelab-api/caddy.nix` (gated on `services.tempo.enable`)
- [ ] Add `tracing` directive to `features/homelab-ui/caddy.nix`
- [ ] Add `tracing` directive to `services/kanidm.nix` (HTTPS vhost)
- [ ] Add `tracing` directive to `services/prometheus.nix` (mTLS vhost)
- [ ] Add `tracing` directive to `services/loki.nix` (mTLS loki-push vhost)
- [ ] Add `tracing` directive to `services/apprise.nix` (mTLS vhost)
- [ ] Add `tempo` to `services.failure-notifs.attachServices` (in the tempo module)
- [ ] Deploy and verify traces appear in Grafana → Explore → Tempo

---

## Verification

After deployment:

1. Check `systemctl status tempo` — should be active
2. Open Grafana → Explore → Select "Tempo" datasource
3. Search for traces — homelab-api and kanidm traces should appear within minutes
4. Verify trace-to-log correlation: clicking a trace span should link to corresponding Loki logs
5. Check Caddy traces appear when making requests through the reverse proxy

---

## Notes

- **No external access:** All Tempo ports are bound to 127.0.0.1. No Caddy vhost needed.
- **No authentication:** Since it's localhost-only, auth is unnecessary. If we later expose Tempo externally (e.g. for traces from praeconinus), we'd need mTLS like Prometheus.
- **Storage:** Local filesystem. At homelab scale with 72h retention, storage should be minimal (likely < 1GB). Monitor and adjust.
- **Kanidm large spans:** The 20MB gRPC message size accommodates Kanidm's large startup traces per their documentation.
