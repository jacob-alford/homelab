{ inputs
, lib
, config
, pkgs
, pkgs-unstable
, ...
}: {
  home.packages = with pkgs; [
    yubikey-manager
    httpie
  ];

  programs.home-manager.enable = true;

  programs.starship = {
    enable = true;
    enableZshIntegration = true;
  };

  programs.git = {
    enable = true;
    userName = "Jacob Alford";
    userEmail = "github.scouting378@passmail.net";
    extraConfig = {
      init = {
        defaultBranch = "main";
      };

      pull = {
        rebase = true;
      };

      core = {
        editor = "nvim";
      };

      push = {
        autoSetupRemote = true;
      };

      gpg = {
        format = "ssh";
      };

      commit = {
        gpgsign = true;
      };

      user = {
        signingkey = "~/.ssh/id_ed25519";
      };
    };
  };
}
