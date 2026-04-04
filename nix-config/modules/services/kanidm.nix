{ config, ... }:
let
  c = config.constants;
  svc = c.services.kanidm;
in
{
  flake.modules.nixos.kanidm =
    { config, lib, pkgs, ... }:
    let
      inherit (config.security.acme.certs."${svc.domain}") directory;
    in
    {
      services.kanidm = {
        package = pkgs.kanidmWithSecretProvisioning_1_9;

        enableClient = true;
        clientSettings.uri = config.services.kanidm.serverSettings.origin;

        enableServer = true;
        serverSettings = {
          domain = svc.domain;
          origin = "https://${svc.domain}";
          trust_x_forward_for = true;
          ldapbindaddress = "127.0.0.1:636";
          bindaddress = "127.0.0.1:8443";

          tls_key = "${directory}/key.pem";
          tls_chain = "${directory}/fullchain.pem";

          online_backup = {
            versions = 7;
            path = svc.backupPath;
          };
        };

        provision = {
          adminPasswordFile = config.sops.secrets.kanidm_admin_passphrase.path;
          idmAdminPasswordFile = config.sops.secrets.kanidm_idm_admin_passphrase.path;

          enable = true;
          autoRemove = true;

          groups = {
            "radius.access" = { };
            "radius.access_home" = { };
            "radius.access_guest" = { };
            "radius.access_private" = { };

            "openwebui.admins" = { };
            "openwebui.access" = { };

            "home-assistant.access" = { };
            "home-assistant.admins" = { };

            "nextcloud.admins" = { };
            "nextcloud.access" = { };

            "jellyfin.admins" = { };
            "jellyfin.access" = { };

            "planka.access" = { };
            "planka.admins" = { };
            "planka.project_owner" = { };

            "step-ca.access" = { };
          };

          persons = {
            "jacob-nutrien" = {
              displayName = "Jacob Alford (Nutrien)";
              mailAddresses = [ "nutrien-github@a.plato-splunk.media" ];
              groups = [
                "radius.access"
                "radius.access_guest"
              ];
            };
            "guest" = {
              displayName = "Guest Account";
              mailAddresses = [ "guest@a.plato-splunk.media" ];
              groups = [
                "radius.access"
                "radius.access_guest"
              ];
            };
            kaitlyn = {
              displayName = "Kaitlyn Hill";
              mailAddresses = [ "kaitlynxone@gmail.com" ];
              groups = [
                "radius.access"
                "radius.access_home"
                "planka.access"
                "planka.project_owner"
              ];
            };
            jacob = {
              displayName = "Jacob Alford";
              mailAddresses = [ "jacob@plato-splunk.media" ];
              groups = [
                "radius.access"
                "radius.access_home"
                "radius.access_private"

                "openwebui.admins"
                "openwebui.access"

                "nextcloud.admins"
                "nextcloud.access"

                "jellyfin.admins"
                "jellyfin.access"

                "home-assistant.access"
                "home-assistant.admins"

                "planka.access"
                "planka.project_owner"
                "planka.admins"

                "step-ca.access"
              ];
            };
          };
        };
      };

      services.caddy.virtualHosts."https://${svc.domain}" = {
        extraConfig = ''
          tls "${directory}/fullchain.pem" "${directory}/key.pem"
          reverse_proxy ${config.services.kanidm.provision.instanceUrl} {
            header_up HOST {host}
            transport http {
              tls_server_name ${svc.domain}
            }
          }
        '';
      };

      services.caddy.virtualHosts."http://${svc.domain}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString svc.acmePort}
        '';
      };

      services.caddy.virtualHosts."http://${svc.ldapDomain}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString svc.acmePort}
        '';
      };

      users.groups.idm.members = [
        "caddy"
        "kanidm"
      ];

      security.acme.certs."${svc.domain}" = {
        domain = svc.domain;
        listenHTTP = "127.0.0.1:${builtins.toString svc.acmePort}";
        server = c.ca.acmeDirectory;
        group = "idm";
        reloadServices = [
          "caddy.service"
          "kanidm.service"
        ];
      };

      services.restic.backups.kanidm = {
        user = "restic";
        repository = "/mnt/backups/kanidm";
        initialize = true;
        passwordFile = config.sops.templates."kanidm-backup-passphrase".path;
        paths = [ svc.backupPath ];
        timerConfig = {
          OnCalendar = "Mon..Sun *-*-* 23:30:00";
          Persistent = true;
        };
        package = pkgs.writeShellScriptBin "restic" ''
          exec /run/wrappers/bin/restic "$@"
        '';
      };
    };
}
