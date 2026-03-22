# This is your home-manager configuration file
# Use this to configure your home environment (it replaces ~/.config/nixpkgs/home.nix)
{
  inputs,
  lib,
  config,
  pkgs,
  ...
}:
{
  imports = [
    inputs.catppuccin.homeModules.catppuccin
    inputs.nixvim.homeModules.nixvim
    ../../shared/programs/git.nix
    ../../shared/programs/nixvim.nix
    ../../shared/programs/vscode.nix
    ../../shared/programs/zsh.nix
    ./programs.nix
    ./theming.nix
  ];

  nixpkgs = {
    overlays = [ ];
    config = {
      allowUnfree = true;
      # Workaround for https://github.com/nix-community/home-manager/issues/2942
      allowUnfreePredicate = _: true;
    };
  };

  home = {
    username = "jacob";
    homeDirectory = "/home/jacob";
  };

  dconf = {
    enable = true;
  };

  home.sessionVariables = {
    STEAM_EXTRA_COMPAT_TOOLS_PATHS = "\${HOME}/.steam/root/compatibilitytools.d";
    SSH_AUTH_SOCK = "$XDG_RUNTIME_DIR/ssh-agent";
    EDITOR = "nvim";
    CA_URL = "https://ca.plato-splunk.media";
    CA_FINGERPRINT = "56c220018d0c65d5283d46d7c769eb471c18b2e903b205a9457261b2c52f2392";
    # NIXOS_OZONE_WL = "1";
  };

  # Nicely reload system units when changing configs
  systemd.user.startServices = "sd-switch";

  # https://nixos.wiki/wiki/FAQ/When_do_I_update_stateVersion
  home.stateVersion = "24.05";
}
