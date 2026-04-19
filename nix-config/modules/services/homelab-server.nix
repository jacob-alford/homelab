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
            "homelab_admins" = [
              "Config.Wifi"
              "Config.ACME"
              "Config.Certs"
              "Status.Health"
            ];
            "homelab_access" = [
              "Config.Wifi"
              "Config.Certs"
            ];
          };
        };
      };
    };
}
