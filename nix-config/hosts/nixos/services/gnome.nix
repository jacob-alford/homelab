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
  services.desktopManager.gnome = {
    enable = true;
  };

  services.displayManager.gdm = {
    enable = true;
    wayland = true;
  };

  services.gnome.gcr-ssh-agent.enable = false;
}
