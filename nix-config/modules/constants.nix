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
        system = "x86_64-linux";
      };
      cicero = {
        system = "x86_64-linux";
      };
      praeconinus = {
        system = "aarch64-linux";
      };
      nixos = {
        system = "x86_64-linux";
      };
      mini = {
        system = "aarch64-darwin";
      };
    };

    nvidia = {
      version = "595.80";
      sha256_64bit = "sha256-PVTIP+B/01c/8M66hXTAYTLg9T2Hy9u1gq43K7TF1Hg=";
      openSha256 = "sha256-nonwYYPItHeMC/5Ox/TlWhjiddMPu4PLqNhgIg+bfW8=";
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
