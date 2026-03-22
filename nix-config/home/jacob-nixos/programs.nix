{
  inputs,
  lib,
  config,
  pkgs,
  pkgs-unstable,
  ...
}:
let
  identityAgent = "/run/user/1000/ssh-agent";
  vivaldi-nvidia = pkgs.vivaldi.override {
    commandLineArgs = [
      # "--enable-features=AcceleratedVideoEncoder,VaapiOnNvidiaGPUs,VaapiIgnoreDriverChecks,Vulkan,DefaultANGLEVulkan,VulkanFromANGLE"
      # "--enable-features=VaapiIgnoreDriverChecks,VaapiVideoDecoder,PlatformHEVCDecoderSupport"
      # "--enable-features=UseMultiPlaneFormatForHardwareVideo"
      # "--ignore-gpu-blocklist"
      # "--enable-zero-copy"
      # "--use-angle=opengl"
    ];
    enableWidevine = true;
  };
in
{
  home.packages = with pkgs; [
    steam
    protonup-ng
    kitty
    prismlauncher
    discord
    makemkv
    protonvpn-gui
    bolt-launcher
    mullvad-browser
    yubikey-manager
    finamp
    freecad-wayland
    httpie
    dmidecode
    popsicle
    google-fonts
    inputs.affinity-nix.packages.x86_64-linux.photo
    inputs.affinity-nix.packages.x86_64-linux.designer
    inputs.affinity-nix.packages.x86_64-linux.publisher
    typst
    github-copilot-cli
    jq
    vlc
    step-cli
    teams-for-linux
    vivaldi-nvidia
  ];

  programs.kitty = {
    enable = true;
    enableGitIntegration = true;
    font.name = "victor-mono";
  };

  programs.ghostty = {
    enable = true;
    enableZshIntegration = true;
    settings = {
      font-family = "victor-mono";
    };
  };

  programs.mangohud = {
    enable = true;
    settings = {
      gpu_temp = true;
      gpu_core_clock = true;
      gpu_load_value = true;
      gpu_fan = true;

      cpu_temp = true;
      cpu_mhz = true;
      cpu_load_value = true;
    };
  };

  programs.home-manager.enable = true;

  programs.ssh = {
    enable = true;
    enableDefaultConfig = false;
    matchBlocks = {
      "augustus.plato-splunk.media" = {
        inherit identityAgent;
        user = "jacob";
        forwardAgent = true;
        userKnownHostsFile = "~/.step/known_hosts";
        proxyCommand = "step ssh proxycommand %r %h %p --provisioner \"kanidm\"";
        extraOptions = {
          IdentitiesOnly = "no";
        };
      };
      "cicero.plato-splunk.media" = {
        inherit identityAgent;
        user = "jacob";
        forwardAgent = true;
        userKnownHostsFile = "~/.step/known_hosts";
        proxyCommand = "step ssh proxycommand %r %h %p --provisioner \"kanidm\"";
        extraOptions = {
          IdentitiesOnly = "no";
        };
      };
      "mini.plato-splunk.media" = {
        inherit identityAgent;
        user = "jacob";
        forwardAgent = true;
        userKnownHostsFile = "~/.step/known_hosts";
        proxyCommand = "step ssh proxycommand %r %h %p --provisioner \"kanidm\"";
        extraOptions = {
          IdentitiesOnly = "no";
        };
      };
      "exec \"step ssh check-host %h\"" = {
        inherit identityAgent;
        user = "jacob";
        forwardAgent = true;
        userKnownHostsFile = "~/.step/known_hosts";
        proxyCommand = "step ssh proxycommand %r %h %p --provisioner \"kanidm\"";
        extraOptions = {
          IdentitiesOnly = "no";
        };
      };
      "augustus.neko-bicolor.ts.net" = {
        inherit identityAgent;
        user = "jacob";
        addKeysToAgent = "yes";
        forwardAgent = true;
        identityFile = "~/.ssh/yk_ssh_keys/id_ed25519_sk_yk3_backup";
      };
      "cicero.neko-bicolor.ts.net" = {
        inherit identityAgent;
        user = "jacob";
        addKeysToAgent = "yes";
        forwardAgent = true;
        identityFile = "~/.ssh/yk_ssh_keys/id_ed25519_sk_yk3_backup";
      };
      "mini.neko-bicolor.ts.net" = {
        inherit identityAgent;
        user = "jacob";
        addKeysToAgent = "yes";
        forwardAgent = true;
        identityFile = "~/.ssh/yk_ssh_keys/id_ed25519_sk";
      };
      "github.com" = {
        user = "git";
        identityFile = "~/.ssh/yk_ssh_keys/id_ed25519_sk";
      };
      "*" = {
        forwardAgent = false;
        addKeysToAgent = "no";
        compression = false;
        serverAliveInterval = 0;
        serverAliveCountMax = 3;
        hashKnownHosts = false;
        userKnownHostsFile = "~/.ssh/known_hosts";
        controlMaster = "no";
        controlPath = "~/.ssh/master-%r@%n:%p";
        controlPersist = "no";
      };
    };
    extraConfig = ''
      IdentitiesOnly yes
      IdentityAgent none
    '';
  };

  programs.starship = {
    enable = true;
    enableZshIntegration = true;
  };
}
