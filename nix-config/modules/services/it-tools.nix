{ config, ... }:
let
  c = config.constants;
  svc = c.services.it-tools;
in
{
  flake.modules.nixos.it-tools =
    { config, lib, pkgs, ... }:
    {
      virtualisation.oci-containers.containers = {
        it-tools = {
          image = "sharevb/it-tools:latest";
          ports = [ "127.0.0.1:${builtins.toString svc.port}:8080" ];
        };
      };

      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString svc.port}
        '';
      };
    };
}
