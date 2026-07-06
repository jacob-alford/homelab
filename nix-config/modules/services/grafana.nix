{ config, ... }:
let
  c = config.constants;
  svc = c.services.grafana;
  promSvc = c.services.prometheus;
  lokiSvc = c.services.loki;
in
{
  flake.modules.nixos.grafana =
    {
      config,
      lib,
      pkgs,
      ...
    }:
    {
      # Kanidm OIDC client registration
      services.kanidm.provision.systems.oauth2."${svc.clientId}" = {
        originUrl = "${svc.url}/login/generic_oauth";
        originLanding = "${svc.url}/";
        displayName = "Grafana";

        basicSecretFile = config.sops.secrets.grafana_client_secret.path;

        scopeMaps."grafana.access" = [
          "openid"
          "email"
          "profile"
        ];

        claimMaps.roles = {
          joinType = "array";
          valuesByGroup = {
            "grafana.admins" = [ "admin" ];
            "grafana.access" = [ "editor" ];
          };
        };
      };

      services.grafana = {
        enable = true;

        settings = {
          server = {
            http_addr = "127.0.0.1";
            http_port = svc.port;
            domain = svc.domain;
            root_url = svc.url;
          };

          "auth.generic_oauth" = {
            enabled = true;
            name = "Kanidm";
            client_id = svc.clientId;
            client_secret = "$__file{${config.sops.templates."grafana-client-secret".path}}";
            scopes = "openid email profile";
            auth_url = "https://${c.idm.domain}/ui/oauth2";
            token_url = "https://${c.idm.domain}/oauth2/token";
            api_url = "https://${c.idm.domain}/oauth2/openid/${svc.clientId}/userinfo";
            login_attribute_path = "preferred_username";
            role_attribute_path = "contains(roles[*], 'admin') && 'Admin' || 'Editor'";
            allow_sign_up = true;
            auto_login = true;
            use_pkce = true;
            tls_client_ca = c.ca.rootCert;
          };

          auth = {
            disable_login_form = true;
          };

          security = {
            secret_key = "$__file{${config.sops.secrets.grafana_secret.path}}";
          };

          analytics = {
            reporting_enabled = false;
            check_for_updates = false;
            check_for_plugin_updates = false;
          };
        };

        provision = {
          enable = true;

          datasources.settings.datasources = [
            {
              name = "Prometheus";
              type = "prometheus";
              url = "http://127.0.0.1:${toString promSvc.port}";
              isDefault = true;
              access = "proxy";
            }
            {
              name = "Loki";
              type = "loki";
              url = "http://127.0.0.1:${toString lokiSvc.port}";
              access = "proxy";
            }
          ];

          alerting.contactPoints.settings.contactPoints = [
            {
              orgId = 1;
              name = "Apprise";
              receivers = [
                {
                  uid = "apprise-webhook";
                  type = "webhook";
                  settings = {
                    url = "http://127.0.0.1:${toString c.services.apprise.port}/notify/grafana-alerts";
                    httpMethod = "POST";
                    body = builtins.toJSON {
                      body = "{{ template \"default.message\" . }}";
                      type = "warning";
                      tag = "grafana-alerts";
                    };
                  };
                }
              ];
            }
          ];

          alerting.policies.settings.policies = [
            {
              orgId = 1;
              receiver = "Apprise";
            }
          ];
        };
      };

      # Caddy reverse proxy (OIDC handles auth)
      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };

      services.failure-notifs.attachServices = [
        "grafana"
      ];
    };
}
