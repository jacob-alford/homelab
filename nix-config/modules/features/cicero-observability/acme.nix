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

      # Client certificate for Alloy to authenticate when pushing to Augustus' Loki
      # step-ca's default template includes both serverAuth and clientAuth EKU
      security.acme.certs."${ciceroMetrics.domain}" = {
        domain = ciceroMetrics.domain;
        listenHTTP = "127.0.0.1:${builtins.toString ciceroMetrics.acmePort}";
        server = c.ca.acmeDirectoryHttp;
        group = "alloy";
        reloadServices = [
          "alloy.service"
        ];
      };

      users.groups.alloy = { };
    };
}
