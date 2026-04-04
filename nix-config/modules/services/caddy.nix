{ config, ... }:
let
  c = config.constants;
in
{
  flake.modules.nixos.caddy =
    { pkgs, pkgs-unstable, ... }:
    {
      services.caddy = {
        package = pkgs-unstable.caddy.withPlugins {
          plugins = [
            "github.com/tailscale/caddy-tailscale@v0.0.0-20250508175905-642f61fea3cc"
          ];
          hash = "sha256-S6vXxRMJMynh7bmHy2mNl+kyJ5csjUqunu9aaFTwb2M=";
        };

        enable = true;
        email = c.acme.email;
        acmeCA = c.ca.acmeDirectory;
      };
    };
}
