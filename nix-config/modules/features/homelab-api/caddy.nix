{ config, ... }:
let
  svc = config.constants.services.homelab;
in
{
  flake.modules.nixos.homelab-api-caddy =
    { config, ... }:
    {
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };

      services.caddy.virtualHosts."${svc.insecureUrl}" = {
        extraConfig = ''
          reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };
    };
}
