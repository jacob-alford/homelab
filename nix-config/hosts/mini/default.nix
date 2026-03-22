{ inputs
, lib
, config
, pkgs
, ...
}: {
  imports = [
    ../../shared/nix-darwin.nix
    ../../shared/programs/nixvim.nix
    ./programs.nix
    ./services.nix
    ./sops.nix
  ];

  # Set Git commit hash for darwin-version.
  system.configurationRevision = inputs.self.rev or inputs.self.dirtyRev or null;

  system.primaryUser = "jacob";

  # Used for backwards compatibility, please read the changelog before changing.
  # $ darwin-rebuild changelog
  system.stateVersion = 6;

  # The platform the configuration will be used on.
  nixpkgs.hostPlatform = "aarch64-darwin";

  nixpkgs.config.allowUnfree = true;
  nixpkgs.config.allowUnfreePredicate = pkg:
    builtins.elem (lib.getName pkg) [
    ];
}
