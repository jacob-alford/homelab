{ lib, config, pkgs, ... }:
let
  stepCaClientId = "step-ca";
in
{
  programs.git.enable = true;

  programs.zsh.enable = true;

  environment.systemPackages = with pkgs; [
    vim
    step-cli
  ];

  networking.hosts = {
    "127.0.0.1" = [ "postgres-augustus.plato-splunk.media" ];
  };

  services.peesequel = {
    enable = true;
    package = pkgs.postgresql_17_jit;
    enableBackup = true;
    tlsDomain = "postgres-augustus.plato-splunk.media";

    ensureDatabases = [
      "jacob"
      "ca"
    ];

    ensureUsers = [
      {
        name = "jacob";
        ensureDBOwnership = true;
      }
      {
        name = "ca";
        ensureDBOwnership = true;
      }
    ];
  };

  services.kanidm.provision.systems.oauth2."${stepCaClientId}" = {
    originUrl = "http://127.0.0.1:10000";
    originLanding = "http://127.0.0.1:10000";
    displayName = "Step CA";
    allowInsecureClientDisablePkce = false;
    basicSecretFile = config.sops.secrets.step_ca_oidc_client_secret.path;
    scopeMaps."step-ca.access" = [
      "openid"
      "email"
    ];
  };

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
