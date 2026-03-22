{ inputs
, outputs
, lib
, config
, pkgs
, ...
}: {
  programs.zsh = {
    enable = true;
    enableCompletion = true;
    # Didn't make it into 25.05
    # enableAutosuggestions = true;
    enableSyntaxHighlighting = true;

    # oh-my-zsh = {
    #  enable = true;
    #  plugins = [ "git" ];
    # };

    # shellAliases = { };
  };
}
