{
  inputs,
  outputs,
  lib,
  config,
  pkgs,
  pkgs-unstable,
  ...
}:
{
  imports = [
    ./step-ca.nix
    ./openssh.nix
  ];

  services.tailscale.enable = true;

  services.xserver.xkb = {
    layout = "us";
    variant = "";
  };
}
