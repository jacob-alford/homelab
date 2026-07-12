{ config, ... }:
let
  c = config.constants;
  ciceroMetrics = c.services.cicero-metrics;
  stepCa = c.ca;
in
{
  flake.modules.nixos.cicero-observability-caddy =
    { config, lib, ... }:
    {
      services.caddy = {
        enable = true;
        globalConfig = ''
          https_port 8443
        '';
        # Use internal step-ca for Caddy's own server certs
        email = c.acme.email;
        acmeCA = c.ca.acmeDirectoryHttp;
      };

      # HTTP vhost on port 80 to serve ACME http-01 challenges
      # (for both Caddy's own certs AND the NixOS ACME client cert for Alloy)
      services.caddy.virtualHosts."http://${ciceroMetrics.domain}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString ciceroMetrics.acmePort}
        '';
      };

      # mTLS-guarded metrics endpoint (node_exporter)
      # Caddy obtains its own server cert via built-in ACME from step-ca
      services.caddy.virtualHosts."https://${ciceroMetrics.domain}:${toString ciceroMetrics.port}" = {
        extraConfig = ''
          tls {
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

      # mTLS-guarded metrics endpoint (step-ca)
      # Caddy obtains its own server cert via built-in ACME from step-ca
      services.caddy.virtualHosts."https://${stepCa.metricsDomain}:${toString stepCa.metricsPort}" = {
        extraConfig = ''
          tls {
            client_auth {
              mode require_and_verify
              trust_pool file {
                pem_file ${c.ca.rootCert}
              }
            }
          }
          reverse_proxy 127.0.0.1:${builtins.toString stepCa.metricsPortInternal}
        '';
      };
    };
}
