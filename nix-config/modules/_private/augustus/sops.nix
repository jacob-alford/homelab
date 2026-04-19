{ inputs, lib, config, pkgs, ... }:
{
  sops.defaultSopsFile = inputs.self + "/nix-config/secrets/augustus.yaml";
  sops.age.keyFile = "/home/jacob/.config/sops/age/keys.txt";

  sops.secrets.kanidm_admin_passphrase = {
    owner = "kanidm";
    group = "kanidm";
  };

  sops.secrets.kanidm_idm_admin_passphrase = {
    owner = "kanidm";
    group = "kanidm";
  };

  sops.secrets.kanidm_restic_backup_passphrase = {
    owner = "restic";
  };

  sops.templates."kanidm-backup-passphrase" = {
    content = config.sops.placeholder.kanidm_restic_backup_passphrase;
    owner = "restic";
  };

  sops.secrets.postgres_restic_backup_passphrase = {
    owner = "restic";
  };

  sops.templates."postgres-backup-passphrase" = {
    content = config.sops.placeholder.postgres_restic_backup_passphrase;
    owner = "restic";
  };

  sops.secrets.openwebui_client_secret = {
    owner = "kanidm";
  };

  sops.secrets.openwebui_app_secret_key = {
    owner = "openwebui";
  };

  sops.secrets.openwebui_restic_backup_passphrase = {
    owner = "openwebui";
  };

  sops.secrets.home_assistant_client_secret = {
    owner = "kanidm";
  };

  sops.secrets.home_assistant_lat = {
    owner = "hass";
  };

  sops.secrets.home_assistant_long = {
    owner = "hass";
  };

  sops.secrets.unifi_radius_secret = {
    owner = "radiusd";
    group = "radiusd";
  };

  sops.secrets.ui_radius_auth_token = {
    owner = "radiusd";
    group = "radiusd";
  };

  sops.secrets.smb_passphrase = {
    owner = "root";
  };

  sops.templates."smb-creds" = {
    content = ''
      username=augustus
      password=${config.sops.placeholder.smb_passphrase}
    '';
    owner = "root";
  };

  sops.secrets.planka_secret_key = {
    owner = "planka";
  };

  sops.secrets.planka_db_pass = {
    owner = "planka";
    group = "planka-db-pass";
    mode = "0440";
  };

  sops.secrets.planka_default_admin_pass = {
    owner = "planka";
  };

  sops.secrets.planka_client_secret = {
    owner = "kanidm";
  };

  sops.templates."planka-client-secret" = {
    content = config.sops.placeholder.planka_client_secret;
    owner = "planka";
  };

  sops.secrets.planka_restic_backup_passphrase = {
    owner = "restic";
  };

  sops.secrets.homelab_kanidm_client_secret = {
    owner = "kanidm";
  };

  sops.secrets.step_ca_oidc_client_secret = {
    owner = "kanidm";
  };

  sops.secrets.minecraft_backup_passphrase = {
    owner = "restic";
  };

  sops.secrets.step_jwk_provisioner_password = {
    owner = "root";
  };
}
