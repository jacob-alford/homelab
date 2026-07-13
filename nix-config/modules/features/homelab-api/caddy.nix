{ config, ... }:
let
  c = config.constants;
  svc = c.services.homelab;
in
{
  flake.modules.nixos.homelab-api-caddy =
    { config, lib, ... }:
    let
      tracingBlock = lib.optionalString config.services.tempo.enable ''
        tracing {
          span homelab-api
        }
      '';
    in
    {
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          ${tracingBlock}reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };

      services.caddy.virtualHosts."${svc.insecureUrl}" = {
        extraConfig = ''
          ${tracingBlock}reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };
    };
}
