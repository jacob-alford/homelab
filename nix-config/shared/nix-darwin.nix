{ inputs
, lib
, config
, pkgs
, ...
}: {
  nix =
    let
      flakeInputs = lib.filterAttrs (_: lib.isType "flake") inputs;
    in
    {
      settings = {
        experimental-features = "nix-command flakes";
        # Opinionated: disable global registry
        flake-registry = "";
        # Workaround for https://github.com/NixOS/nix/issues/9574
        nix-path = config.nix.nixPath;

        allowed-users = [ "@wheel" ];
      };
      # Opinionated: disable channels
      channel.enable = false;

      # Garbage collection
      gc = {
        automatic = true;
        options = "--delete-older-than 30d";
      };

      # Optimization

      optimise = {
        automatic = true;
      };

      # Opinionated: make flake registry and nix path match flake inputs
      registry = lib.mapAttrs (_: flake: { inherit flake; }) flakeInputs;
      nixPath = lib.mapAttrsToList (n: _: "${n}=flake:${n}") flakeInputs;
    };
}
