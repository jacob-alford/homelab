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
  programs.git.enable = true;

  programs.zsh.enable = true;

  environment.systemPackages = with pkgs; [
    vim
    step-cli
  ];
}
