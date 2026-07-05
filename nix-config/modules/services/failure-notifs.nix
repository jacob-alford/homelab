{ config, ... }:
let
  _c = config.constants;
in
{
  flake.modules.nixos.failure-notifs =
    {
      inputs,
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
        enable = lib.mkEnableOption "Sends an apprise notification one-shot";

        appriseConfigFile = lib.mkOption {
          type = lib.types.str;
          description = "The path to the apprise notification configuration file";
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
          description = "Maps to the tag provided to apprise cli";
          default = "pover";
        };

        emoji = lib.mkOption {
          type = lib.types.str;
          description = "The emoji to use at the beginning of the message";
          default = ":alert:";
        };
      };

      config = lib.mkIf cfg.enable {
        systemd.services.failure-notifs = {
          description = "Sends an apprise notification one-shot";
          after = [
            "network-online.target"
            "podman-apprise.service"
          ];
          wants = [ "network-online.target" ];

          serviceConfig = {
            Type = "oneshot";
            User = "root";
          };

          script = ''
            set -euo pipefail

            SERVICE_NAME=$MONITOR_UNIT
            SERVICE_RESULT=''${MONITOR_SERVICE_RESULT:-"$SERVICE_RESULT"}
            EXIT_CODE=''${MONITOR_EXIT_CODE:-"$MONITOR_EXIT_STATUS"}

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
            body="$emoji $SERVICE_NAME $EXIT_CODE ($SERVICE_RESULT)"

            if [ "$SERVICE_RESULT" != "success" ]; then
              ${pkgs.apprise}/bin/apprise -D \
                --notification-type=${cfg.notificationType} \
                --tag=${cfg.target} \
                --body="$body" \
                --interpret-emojis \
                --config=${cfg.appriseConfigFile}
            fi
          '';
        };
      };
    };
}
