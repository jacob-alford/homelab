{
  flake.modules.darwin.darwin-base =
    { inputs, lib, config, ... }:
    let
      flakeInputs = lib.filterAttrs (_: lib.isType "flake") inputs;
    in
    {
      nix = {
        settings = {
          experimental-features = "nix-command flakes";
          flake-registry = "";
          nix-path = config.nix.nixPath;
          allowed-users = [ "@wheel" ];
        };

        channel.enable = false;

        gc = {
          automatic = true;
          options = "--delete-older-than 30d";
        };

        optimise = {
          automatic = true;
        };

        registry = lib.mapAttrs (_: flake: { inherit flake; }) flakeInputs;
        nixPath = lib.mapAttrsToList (n: _: "${n}=flake:${n}") flakeInputs;
      };
    };
}
