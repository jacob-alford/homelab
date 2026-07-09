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
