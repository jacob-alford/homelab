{
  inputs,
  lib,
  config,
  pkgs,
  ...
}:
{
  catppuccin = {
    enable = true;
    flavor = "frappe";
    accent = "sapphire";
    starship.enable = true;
    kitty.enable = true;
    ghostty.enable = true;
    vivaldi.enable = true;
    mangohud.enable = true;
  };
}
