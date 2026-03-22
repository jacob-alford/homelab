{
  inputs,
  lib,
  config,
  pkgs,
  pkgs-unstable,
  ...
}:
{
  home.packages = with pkgs; [
    yubikey-manager
    httpie
  ];

  programs.home-manager.enable = true;

  programs.starship = {
    enable = true;
    enableZshIntegration = true;
  };
}
