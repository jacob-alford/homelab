{ config, ... }:
let
  c = config.constants;
  svc = c.services.apprise;
in
{
  flake.modules.nixos.failure-notifs =
    {
      config,
      lib,
      pkgs,
      ...
    }:
    let
      cfg = config.services.failure-notifs;
    in
    {
      options.services.failure-notifs = {
        enable = lib.mkEnableOption "Sends an apprise notification one-shot via the Apprise API";

        appriseApiUrl = lib.mkOption {
          type = lib.types.str;
          description = "The base URL of the Apprise API server";
          default = "http://127.0.0.1:${builtins.toString svc.port}";
        };

        notificationType = lib.mkOption {
          type = lib.types.enum [
            "info"
            "success"
            "warning"
            "failure"
          ];
          description = "The severity of the notification type to be issued when run";
          default = "failure";
        };

        target = lib.mkOption {
          type = lib.types.str;
          description = "Maps to the tag provided to apprise";
          default = "systemd-failure";
        };

        emoji = lib.mkOption {
          type = lib.types.str;
          description = "The emoji to use at the beginning of the message";
          default = ":rotating_light:";
        };

        attachServices = lib.mkOption {
          type = lib.types.listOf lib.types.str;
          description = "List of systemd service names to attach OnFailure=failure-notifs.service to";
          default = [ ];
        };
      };

      config = lib.mkIf cfg.enable {
        systemd.services = {
          failure-notifs = {
            description = "Sends an apprise notification one-shot";
            after = [
              "network-online.target"
              "podman-apprise.service"
            ];
            wants = [ "network-online.target" ];

            unitConfig = {
              StartLimitIntervalSec = 60;
              StartLimitBurst = 10;
            };

            serviceConfig = {
              Type = "oneshot";
              User = "root";
            };

            script = ''
              set -eo pipefail

              SERVICE_NAME=$MONITOR_UNIT
              SERVICE_RESULT="''${MONITOR_SERVICE_RESULT:-"$SERVICE_RESULT"}"
              EXIT_CODE="''${MONITOR_EXIT_CODE:-"$MONITOR_EXIT_STATUS"}"

              if [ -z "$SERVICE_NAME" ]; then
                echo "SERVICE_NAME not set!"
                exit 1
              fi

              if [ -z "$SERVICE_RESULT" ]; then
                echo "SERVICE_RESULT not set!"
                exit 1
              fi

              if [ -z "$EXIT_CODE" ]; then
                echo "EXIT_CODE not set!"
                exit 1
              fi

              emoji="${cfg.emoji}"
              body="$emoji $SERVICE_NAME [$EXIT_CODE] ($SERVICE_RESULT)"

              if [ "$SERVICE_RESULT" != "success" ]; then
                ${lib.getExe pkgs.curl} -sf -X POST \
                  "${cfg.appriseApiUrl}/notify/${cfg.target}" \
                  -H "Content-Type: application/json" \
                  -d "$(${lib.getExe pkgs.jq} -n \
                    --arg body "$body" \
                    --arg type "${cfg.notificationType}" \
                    --arg tag "${cfg.target}" \
                    '{body: $body, type: $type, tag: $tag}'
                  )"
              fi
            '';
          };
        }
        // builtins.listToAttrs (
          builtins.map (name: {
            inherit name;
            value = {
              unitConfig.OnFailure = [ "failure-notifs.service" ];
            };
          }) cfg.attachServices
        );
      };
    };
}
