{ config, inputs, ... }:
let
  svc = config.constants.services.homelab;
  pkg = inputs.self.packages.x86_64-linux.homelab-ui;
in
{
  flake.modules.nixos.homelab-ui-caddy =
    { ... }:
    {
      services.caddy.virtualHosts."${svc.frontendUrl}" = {
        extraConfig = ''
          root * ${pkg}
          header /*.html Cache-Control "no-cache, must-revalidate"
          file_server
        '';
      };
    };
}
