{ config, ... }:
let
  c = config.constants;
  svc = c.services.apprise;

  appriseDir = svc.stateDir;
  configDir = "${appriseDir}/config";
  attachDir = "${appriseDir}/attach";
  pluginDir = "${appriseDir}/plugin";

  containerSecretKeyFile = "/run/secrets/apprise-secret-key";
in
{
  flake.modules.nixos.apprise =
    { config, lib, pkgs, ... }:
    {
      users.groups.apprise = {
        gid = 51571;
      };

      users.users.apprise = {
        uid = 51571;
        isSystemUser = true;
        group = "apprise";
        home = appriseDir;
        createHome = true;
      };

      systemd.tmpfiles.rules = [
        "d ${configDir} 0750 apprise apprise -"
        "d ${attachDir} 0750 apprise apprise -"
        "d ${pluginDir} 0750 apprise apprise -"
      ];

      virtualisation.oci-containers.containers.apprise = {
        image = "caronc/apprise:latest";

        user = "${toString config.users.users.apprise.uid}:${toString config.users.groups.apprise.gid}";

        ports = [ "127.0.0.1:${builtins.toString svc.port}:8000" ];

        extraOptions = [
          "--cap-drop=ALL"
          "--security-opt=no-new-privileges:true"
          "--read-only"
          "--mount=type=tmpfs,dst=/tmp"
        ];

        volumes = [
          "${configDir}:/config"
          "${attachDir}:/attach"
          "${pluginDir}:/plugin"
          "${config.sops.secrets.apprise_secret_key.path}:${containerSecretKeyFile}:ro"
        ];

        environment = {
          APPRISE_STATEFUL_MODE = "simple";
          APPRISE_WORKER_COUNT = "1";
          APPRISE_ADMIN = "yes";
          APPRISE_CONFIG_LOCK = "no";
          ALLOWED_HOSTS = "apprise.plato-splunk.media localhost 127.0.0.1";
          LOG_LEVEL = "INFO";
          DEBUG = "no";
          SECRET_KEY_FILE = containerSecretKeyFile;
        };
      };

      services.caddy.virtualHosts."${svc.url}" = {
        extraConfig = ''
          tls {
            client_auth {
              mode require_and_verify
              trust_pool file {
                pem_file ${c.ca.rootCert}
              }
            }
          }
          reverse_proxy 127.0.0.1:${builtins.toString svc.port}
        '';
      };

      services.restic.backups.apprise = {
        user = "restic";
        repository = "/mnt/backups/apprise";
        initialize = true;
        passwordFile = config.sops.secrets.apprise_restic_backup_passphrase.path;
        paths = [ configDir attachDir ];
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
