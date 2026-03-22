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
    ./filesystems.nix
    ./sops.nix
    ./acme.nix
  ];

  nixpkgs.config.allowUnfree = true;

  # This value determines the NixOS release from which the default
  # settings for stateful data, like file locations and database versions
  # on your system were taken. It‘s perfectly fine and recommended to leave
  # this value at the release version of the first install of this system.
  # Before changing this value read the documentation for this option
  # (e.g. man configuration.nix or on https://nixos.org/nixos/options.html).
  system.stateVersion = "25.05"; # Did you read the comment?
}
