{
  inputs,
  outputs,
  lib,
  config,
  pkgs,
  pkgs-unstable,
  ...
}:
let
  domain = "https://openwebui.plato-splunk.media";
  clientId = "openwebui";
  port = 19553;
in
{
  services.kanidm.provision.systems.oauth2."${clientId}" = {
    originUrl = "${domain}/oauth/oidc/callback";
    originLanding = "${domain}/";
    displayName = "Open WebUI";

    basicSecretFile = config.sops.secrets.openwebui_client_secret.path;

    scopeMaps."openwebui.access" = [
      "openid"
      "email"
      "profile"
    ];

    claimMaps.roles = {
      joinType = "array";
      valuesByGroup = {
        "openwebui.admins" = [ "admin" ];
        "openwebui.access" = [ "user" ];
      };
    };
  };

  sops.templates."openwebui-env" = {
    content = ''
      OAUTH_CLIENT_ID=${clientId}
      OAUTH_CLIENT_SECRET=${config.sops.placeholder."openwebui_client_secret"}
      OPENID_PROVIDER_URL=https://idm.plato-splunk.media/oauth2/openid/${clientId}/.well-known/openid-configuration
      OAUTH_PROVIDER_NAME=Kanidm
      OAUTH_CODE_CHALLENGE_METHOD=S256
      OPENID_REDIRECT_URI=${domain}/oauth/oidc/callback
      ENABLE_OAUTH_ROLE_MANAGEMENT=true
      ENABLE_OAUTH_SIGNUP=true
      OAUTH_ALLOWED_ROLES=user
      OAUTH_ADMIN_ROLES=admin
      SSL_CERT_FILE=${config.environment.etc."ssl/certs/ca-certificates.crt".source}
    '';
  };

  services.open-webui = {
    inherit port;
    host = "127.0.0.1";
    enable = true;
    environmentFile = config.sops.templates."openwebui-env".path;
  };

  services.caddy.virtualHosts."${domain}" = {
    extraConfig = ''
      reverse_proxy localhost:${builtins.toString port}
    '';
  };
}
