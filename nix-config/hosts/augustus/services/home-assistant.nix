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
  domain = "https://home-assistant.plato-splunk.media";
  clientId = "home-assistant";
  configDir = "/var/lib/hass";
  port = 8123;
in
{
  services.kanidm.provision.systems.oauth2."${clientId}" = {
    originUrl = "${domain}/auth/oidc/callback";
    originLanding = "${domain}/auth/oidc/welcome";
    displayName = "Home Assistant";

    basicSecretFile = config.sops.secrets.home_assistant_client_secret.path;

    scopeMaps."home-assistant.access" = [
      "openid"
      "email"
      "groups"
      "profile"
    ];
  };

  sops.templates."home-assistant-secrets.yaml" = {
    owner = "hass";
    content = ''
      home_assistant_lat: "${config.sops.placeholder.home_assistant_lat}"
      home_assistant_long: "${config.sops.placeholder.home_assistant_long}"
      oauth_client_secret: "${config.sops.placeholder.home_assistant_client_secret}"
    '';
    path = "${configDir}/secrets.yaml";
  };

  services.home-assistant = {
    enable = true;

    customComponents = with pkgs.home-assistant-custom-components; [
      auth_oidc
    ];

    extraComponents = [
      # "Necessary to complete the onboarding"
      "default_config"
      "met"
      "esphome"

      # Mobile App
      "mobile_app"

      # AI
      "ollama"
      "wyoming"

      # Devices
      "apple_tv"
      "homekit"
      "homekit_controller"
      "sonos"
      "hue"
      "ecovacs"
    ];

    config = {
      inherit configDir;

      name = "Home";
      latitude = "!secret home_assistant_lat";
      longitude = "!secret home_assistant_long";
      unit_system = "us_customary";
      time_zone = "US/Mountain";

      mobile_app = { };

      api = { };

      http = {
        server_port = port;
        server_host = "127.0.0.1";
        use_x_forwarded_for = true;
        trusted_proxies = [
          "127.0.0.1"
        ];
      };

      auth_oidc = {
        client_id = clientId;
        client_secret = "!secret oauth_client_secret";
        discovery_url = "https://idm.plato-splunk.media/oauth2/openid/${clientId}/.well-known/openid-configuration";
        features = {
          automatic_person_creation = true;
        };
        id_token_signing_alg = "ES256";
        roles = {
          admin = "home-assistant.admins@idm.plato-splunk.media";
          user = "home-assistant.access@idm.plato-splunk.media";
        };
      };
    };
  };

  services.caddy.virtualHosts."${domain}" = {
    extraConfig = ''
      reverse_proxy localhost:${builtins.toString port}
    '';
  };
}
