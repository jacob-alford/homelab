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
  # For gnome
  programs.dconf.enable = true;

  programs.firefox.enable = true;

  programs.steam.enable = true;

  programs.steam.gamescopeSession.enable = true;

  programs.gamemode.enable = true;

  programs._1password.enable = true;

  programs._1password-gui = {
    enable = true;
    polkitPolicyOwners = [ "jacob" ];
  };

  environment.etc = {
    "1password/custom_allowed_browsers" = {
      text = ''
        vivaldi-bin
      '';
      mode = "0755";
    };
  };

  programs.zsh.enable = true;

  services.udev.packages = with pkgs; [
    via
    qmk-udev-rules
    gnome-settings-daemon
  ];

  environment.systemPackages = with pkgs; [
    home-manager
    vim
    geekbench
    git
    git-credential-manager
    mangohud
    starship
    zsh
    via
    quickemu
    adwaita-icon-theme
    gnomeExtensions.appindicator
    openssl
    # CIFS (SMB) client
    cifs-utils
    # Backups
    restic
    # for ssh-ca hosting
    step-cli
    podman-compose
    # Chromium graphics driver
    nvidia-vaapi-driver
  ];

  environment.variables = {
    LIBVA_DRIVER_NAME = "nvidia";
    # nvidia vaapi setting
    NVD_BACKEND = "direct";
  };

  environment.gnome.excludePackages = with pkgs; [
    orca
    geary
    gnome-backgrounds
    gnome-tour # GNOME Shell detects the .desktop file on first log-in.
    gnome-user-docs
    epiphany
    gnome-text-editor
    gnome-calculator
    gnome-contacts
    gnome-maps
    gnome-music
    simple-scan
    totem
    yelp
  ];
}
