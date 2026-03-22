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
    settings = {
      user = {
        name = "Jacob Alford";
        email = "github.scouting378@passmail.net";
        signingkey = "~/.ssh/id_ed25519";
      };

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
    };
  };
}
