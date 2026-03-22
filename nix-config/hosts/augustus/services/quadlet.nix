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
  virtualisation.quadlet = {
    enable = true;
    autoEscape = true;
    autoUpdate = {
      enable = true;
    };
  };
}
