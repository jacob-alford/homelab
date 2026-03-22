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
  services.peesequel = {
    enable = true;
    package = pkgs.postgresql_17_jit;
    enableBackup = true;
    tlsDomain = "postgres-augustus.plato-splunk.media";

    ensureDatabases = [
      "jacob"
    ];

    ensureUsers = [
      {
        name = "jacob";
        ensureDBOwnership = true;
      }
    ];
  };

  # Force postgres domain to resolve to localhost for password auth
  networking.hosts = {
    "127.0.0.1" = [ "postgres-augustus.plato-splunk.media" ];
  };

  # Backups
  services.restic.backups.postgres = {
    user = "restic";
    repository = "/mnt/backups/postgres";
    initialize = true;
    passwordFile = config.sops.templates."postgres-backup-passphrase".path;
    paths = [
      "${config.services.postgresqlBackup.location}/all.sql.gz"
    ];
    timerConfig = {
      OnCalendar = "Mon..Sun *-*-* 01:30:00";
      Persistent = true;
    };
    package = pkgs.writeShellScriptBin "restic" ''
      exec /run/wrappers/bin/restic "$@"
    '';
  };
}
