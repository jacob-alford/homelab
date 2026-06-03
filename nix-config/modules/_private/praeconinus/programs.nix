{
  lib,
  config,
  pkgs,
  inputs,
  ...
}:
let
  uiPkg = inputs.self.packages.aarch64-linux.homelab-ui;
in
{
  programs.git.enable = true;
  programs.zsh.enable = true;

  environment.systemPackages = with pkgs; [ vim ];

  services.homelab-api = {
    enable = true;
    originUrl = "https://praeconinus.neko-bicolor.ts.net/api";
    privateKeySecretPath = config.sops.secrets.homelab_api_jwk_password.path;
    requiresKanidm = false;
    apiKeys = { };
    featureFlags = [
      "Config_Wifi.create"
      "Config_Certs.view"
    ];
  };

  services.homelab-secret-provisioner = {
    enable = true;
    privateKeyPasswordFile = config.sops.secrets.homelab_api_jwk_password.path;
    apiKeys = { };
  };

  services.caddy.virtualHosts."https://praeconinus.neko-bicolor.ts.net" = {
    extraConfig = ''
      handle_path /api/* {
        reverse_proxy 127.0.0.1:35427
      }

      handle_path /ui/* {
        root * ${uiPkg}
        header /*.html Cache-Control "no-cache, must-revalidate"
        file_server
      }

      handle {
        redir / /ui/ permanent
      }

      handle {
        redir /ui /ui/ permanent
      }
    '';
  };
}
