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
          {
            job_name = "caddy";
            static_configs = [
              { targets = [ "127.0.0.1:2019" ]; }
            ];
          }
          {
            job_name = "loki";
            static_configs = [
              { targets = [ "127.0.0.1:${toString c.services.loki.port}" ]; }
            ];
            metrics_path = "/metrics";
          }
          {
            job_name = "postgres";
            static_configs = [
              { targets = [ "127.0.0.1:${toString config.services.prometheus.exporters.postgres.port}" ]; }
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

        exporters.postgres = {
          enable = true;
          port = 9187;
          listenAddress = "127.0.0.1";
          dataSourceName = "postgresql:///prometheus_exporter?host=/run/postgresql&sslmode=disable";
          user = "prometheus_exporter";
        };
      };

      # PostgreSQL monitoring user (read-only via pg_monitor)
      users.users.prometheus_exporter = {
        isSystemUser = true;
        group = "prometheus_exporter";
      };

      users.groups.prometheus_exporter = { };

      services.postgresql.ensureUsers = [
        {
          name = "prometheus_exporter";
        }
      ];

      services.postgresql.ensureDatabases = [
        "prometheus_exporter"
      ];

      services.peesequel.grantRoles = {
        prometheus_exporter = [ "pg_monitor" ];
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
        "prometheus-node-exporter"
      ];
    };
}
