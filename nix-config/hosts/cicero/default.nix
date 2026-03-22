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
    inputs.home-manager.nixosModules.home-manager
    ../../shared/nix.nix
    ./services
    ./hardware.nix
    ./programs.nix
    ./system.nix
    ./users.nix
    ./security.nix
    ./sops.nix
  ];

  nixpkgs.config.allowUnfree = true;

  system.stateVersion = "25.11";
}
