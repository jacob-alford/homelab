{
  inputs,
  outputs,
  lib,
  config,
  pkgs,
  pkgs-unstable,
  ...
}:
{
  imports = [
    ./vanilla.nix
  ];

  services.minecraft-servers = {
    enable = true;
    eula = true;
    openFirewall = false;
  };

  ### Minecraft Backups ###
  services.restic.backups.minecraft = {
    user = "restic";
    repository = "/mnt/backups/minecraft-backup";
    initialize = true;
    passwordFile = config.sops.secrets.minecraft_backup_passphrase.path;
    paths = [ "/srv/minecraft" ];
    timerConfig = {
      OnCalendar = "Mon..Sun *-*-* 06,12,18:00:00";
      Persistent = true;
    };
    package = pkgs.writeShellScriptBin "restic" ''
      exec /run/wrappers/bin/restic "$@"
    '';
  };
}
