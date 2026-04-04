{ inputs, lib, config, pkgs, ... }:
{
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  system.autoUpgrade = {
    enable = true;
    dates = "04:00";
    flake = inputs.self.outPath;
    flags = [
      "--update-input"
      "nixpkgs"
    ];
    allowReboot = false;
  };

  networking.networkmanager.enable = true;

  time.timeZone = "America/Denver";

  i18n.defaultLocale = "en_US.UTF-8";

  i18n.extraLocaleSettings = {
    LC_ADDRESS = "en_US.UTF-8";
    LC_IDENTIFICATION = "en_US.UTF-8";
    LC_MEASUREMENT = "en_US.UTF-8";
    LC_MONETARY = "en_US.UTF-8";
    LC_NAME = "en_US.UTF-8";
    LC_NUMERIC = "en_US.UTF-8";
    LC_PAPER = "en_US.UTF-8";
    LC_TELEPHONE = "en_US.UTF-8";
    LC_TIME = "en_US.UTF-8";
  };

  hardware.keyboard.qmk.enable = true;

  fonts = {
    packages = with pkgs; [
      victor-mono
      noto-fonts
      noto-fonts-color-emoji
    ];

    fontconfig = {
      useEmbeddedBitmaps = true;
      defaultFonts = {
        serif = [ "noto-serif" ];
        sansSerif = [ "noto-sans-meetei-mayek" ];
        monospace = [ "victor-mono" ];
      };
    };
  };

  services.tailscale.enable = true;

  nixpkgs = {
    overlays = [
      (self: super: {
        ctranslate2 = super.ctranslate2.override {
          withCUDA = true;
          withCuDNN = true;
        };
      })

      (final: prev: {
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

  system.stateVersion = "24.05";
}
