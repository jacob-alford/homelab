{
  inputs,
  lib,
  config,
  ...
}:
let
  baseDomain = "plato-splunk.media";
  mkDomain = subdomain: "${subdomain}.${baseDomain}";
  mkUrl = subdomain: "https://${mkDomain subdomain}";
  certsDir = inputs.self + "/certs";
  idmDomain = mkDomain "idm";
  mkOidcEndpoint =
    clientId: "https://${idmDomain}/oauth2/openid/${clientId}/.well-known/openid-configuration";
in
{
  config.constants = {
    inherit baseDomain;

    certsDir = certsDir;

    ca = {
      domain = mkDomain "ca";
      url = mkUrl "ca";
      acmeDirectory = "https://${mkDomain "ca"}/acme/acme/directory";
      rootCert = certsDir + "/alford-root.crt";
      intermediateCert = certsDir + "/intermediate_ca_2.crt";
      sshUserCaCert = certsDir + "/ssh_user_ca_key.pub";
    };

    acme.email = "web@jacob-alford.dev";

    idm = {
      domain = idmDomain;
      url = "https://${idmDomain}";
      inherit mkOidcEndpoint;
    };

    postgres = {
      domain = mkDomain "postgres-augustus";
      port = 5432;
    };

    services = {
      home-assistant = {
        subdomain = "home-assistant";
        domain = mkDomain "home-assistant";
        url = mkUrl "home-assistant";
        clientId = "home-assistant";
        port = 8123;
        configDir = "/var/lib/hass";
      };

      openwebui = {
        subdomain = "openwebui";
        domain = mkDomain "openwebui";
        url = mkUrl "openwebui";
        clientId = "openwebui";
        port = 19553;
        stateDir = "/var/lib/open-webui";
      };

      planka = {
        subdomain = "planka";
        domain = mkDomain "planka";
        url = mkUrl "planka";
        clientId = "planka";
        port = 1337;
        stateDir = "/var/lib/planka";
      };

      homelab = {
        subdomain = "homelab";
        domain = mkDomain "homelab";
        clientId = "homelab";
        url = mkUrl "homelab";
      };

      it-tools = {
        subdomain = "dev-tools";
        domain = mkDomain "dev-tools";
        url = mkUrl "dev-tools";
        port = 47309;
      };

      kanidm = {
        subdomain = "idm";
        domain = idmDomain;
        ldapDomain = mkDomain "ldap";
        backupPath = "/var/lib/kanidm/backups";
        acmePort = 64073;
      };

      radius = {
        subdomain = "radius";
        domain = mkDomain "radius";
        acmePort = 22378;
      };

      postgres = {
        subdomain = "postgres-augustus";
        domain = mkDomain "postgres-augustus";
        acmePort = 41872;
      };

      step-ca = {
        subdomain = "ca";
        domain = mkDomain "ca";
        clientId = "step-ca";
        port = 443;
      };

      minecraft = {
        port = 25565;
        backupRepository = "/mnt/backups/minecraft-backup";
        stateDir = "/srv/minecraft";
      };

      ollama = {
        port = 11434;
      };

      wyoming = {
        whisperPort = 10300;
        piperPort = 10200;
      };
    };
  };
}
