{ config, ... }:
let
  c = config.constants;
  svc = c.services.prometheus;
in
{
  flake.modules.nixos.prometheus =
    {
      config,
      lib,
      pkgs,
      ...
    }:
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
                    expr = "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100) > 85";
                    "for" = "5m";
                    labels.severity = "warning";
                    annotations.summary = "High CPU usage on {{ $labels.instance }}";
                  }
                  {
                    alert = "HighMemoryUsage";
                    expr = "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90";
                    "for" = "5m";
                    labels.severity = "warning";
                    annotations.summary = "High memory usage on {{ $labels.instance }}";
                  }
                  {
                    alert = "DiskSpaceLow";
                    expr = "(1 - node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"}) * 100 > 85";
                    "for" = "5m";
                    labels.severity = "critical";
                    annotations.summary = "Disk space low on {{ $labels.instance }}";
                  }
                  {
                    alert = "SystemdUnitFailed";
                    expr = "node_systemd_unit_state{state=\"failed\"} == 1";
                    "for" = "1m";
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
