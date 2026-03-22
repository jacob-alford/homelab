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
  clientId = "step-ca";
in
{
  # Provision OIDC client for step-ca in Kanidm
  services.kanidm.provision.systems.oauth2."${clientId}" = {
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

  # Provision database for step-ca
  services.peesequel.ensureDatabases = [ "ca" ];

  services.peesequel.ensureUsers = [
    {
      name = "ca";
      ensureDBOwnership = true;
    }
  ];
}
