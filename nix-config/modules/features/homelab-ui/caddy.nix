{ config, inputs, ... }:
let
  svc = config.constants.services.homelab;
  pkg = inputs.self.packages.x86_64-linux.homelab-ui;
in
{
  flake.modules.nixos.homelab-ui-caddy =
    { config, lib, ... }:
    let
      tracingBlock = lib.optionalString config.services.tempo.enable ''
        tracing {
          span homelab-ui
        }
      '';
    in
    {
      services.caddy.virtualHosts."${svc.frontendUrl}" = {
        extraConfig = ''
          ${tracingBlock}root * ${pkg}
          header /*.html Cache-Control "no-cache, must-revalidate"
          file_server
        '';
      };
    };
}
