{ inputs, lib, ... }:
{
  options.constants = lib.mkOption {
    type = lib.types.attrs;
    default = { };
    description = "Shared constants available to all flake-parts modules";
  };

  options.flake.homeConfigurations = lib.mkOption {
    type = lib.types.attrsOf lib.types.raw;
    default = { };
    description = "Home Manager configurations keyed by user@host";
  };

  options.flake.modules = lib.mkOption {
    type = lib.types.attrsOf (lib.types.attrsOf lib.types.raw);
    default = { };
    description = "Named NixOS/homeManager/darwin module functions, keyed by class then aspect name";
  };

  config.constants = {
    hosts = {
      augustus = {
        ip = "10.76.100.x";
        system = "x86_64-linux";
      };
      cicero = {
        ip = "10.76.100.y";
        system = "x86_64-linux";
      };
      nixos = {
        system = "x86_64-linux";
      };
      mini = {
        system = "aarch64-darwin";
      };
    };

    users = {
      jacob = {
        name = "jacob";
        uid = 1000;
      };
    };

    secretsDir = inputs.self + "/nix-config/secrets";
  };
}
