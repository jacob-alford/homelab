{ config, ... }:
let
  c = config.constants;
  svc = c.services.homelab;
in
{
  flake.modules.nixos.homelab =
    {
      config,
      lib,
      pkgs,
      ...
    }:
    {
      services.kanidm.provision.systems.oauth2."${svc.clientId}" = {
        originUrl = [
          "${svc.url}/oauth/callback"
          "http://localhost:4321"
        ];
        originLanding = "${svc.url}";
        displayName = "Homelab";

        basicSecretFile = config.sops.secrets.homelab_kanidm_client_secret.path;

        claimMaps.roles = {
          joinType = "array";
          valuesByGroup = {
            "homelab.admins" = [
              "Config_Wifi"
              "Config_ACME"
              "Config_Certs"
              "Status_Health"
            ];
            "homelab.access" = [
              "Config_Wifi"
              "Config_Certs"
            ];
          };
        };
      };
    };
}
