{ config, ... }:
let
  c = config.constants;
  svc = c.services.ollama;
in
{
  flake.modules.nixos.ollama =
    { pkgs-unstable, ... }:
    {
      services.ollama = {
        enable = true;
        acceleration = "cuda";
        package = pkgs-unstable.ollama;

        openFirewall = true;

        host = "0.0.0.0";
        port = svc.port;
      };
    };
}
