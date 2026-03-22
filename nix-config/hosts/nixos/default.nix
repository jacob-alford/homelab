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
    ./filesystems.nix
    ./hardware.nix
    ./programs.nix
    ./security.nix
    ./sops.nix
    ./system.nix
    ./users.nix
  ];

  nixpkgs = {
    overlays = [
      ### Ollama Patch to use CUDA ###
      (self: super: {
        ctranslate2 = super.ctranslate2.override {
          withCUDA = true;
          withCuDNN = true;
        };
      })

      (final: prev: {
        # Disable gnonme-keyring SSH functionality
        gnome-keyring = prev.gnome-keyring.overrideAttrs (oldAttrs: {
          configureFlags = (builtins.filter (flag: flag != "--Dssh-agent=true") oldAttrs.mesonFlags) ++ [
            "--Dssh-agent=false"
          ];
        });
      })
    ];

    config = {
      allowUnfree = true;

      allowUnfreePredicate =
        pkg:
        builtins.elem (lib.getName pkg) [
          "1password-gui"
          "1password"
        ];
    };
  };

  # https://nixos.wiki/wiki/FAQ/When_do_I_update_stateVersion
  system.stateVersion = "24.05";
}
