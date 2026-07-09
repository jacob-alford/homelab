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
