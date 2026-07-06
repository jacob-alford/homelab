{ config, ... }:
let
  c = config.constants;
in
{
  flake.modules.nixos.caddy =
    { pkgs-unstable, lib, config, ... }:
    {
      options.services.caddy.useInternalCA = lib.mkEnableOption "Use internal step-ca for ACME";

      config = {
        services.caddy = {
          package = pkgs-unstable.caddy;
          enable = true;
          email = lib.mkIf config.services.caddy.useInternalCA c.acme.email;
          acmeCA = lib.mkIf config.services.caddy.useInternalCA c.ca.acmeDirectory;
        };
      };
    };
}
