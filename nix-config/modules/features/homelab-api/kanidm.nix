{ config, ... }:
let
  c = config.constants;
  svc = c.services.homelab;
in
{
  flake.modules.nixos.homelab-kanidm =
    {
      config,
      lib,
      pkgs,
      ...
    }:
    {
      services.kanidm.provision.systems.oauth2."${svc.clientId}" = {
        public = true;

        originUrl = [
          "${svc.frontendUrl}/oauth/callback"
          "http://localhost:4321/oauth/callback"
        ];
        originLanding = "${svc.url}";
        displayName = "Homelab";

        scopeMaps = {
          "homelab.admins" = [
            "openid"
            "profile"
            "email"
          ];
          "homelab.access" = [
            "openid"
            "profile"
            "email"
          ];
        };

        claimMaps.roles = {
          joinType = "array";
          valuesByGroup = {
            "homelab.admins" = [
              "Config_Wifi"
              "Config_Certs"
              "Config_DNS"
              "Status_Health"
              "Status_Self"
              "OAuth_ClaimCheck"
            ];
            "homelab.access" = [
              "Config_Wifi"
              "Config_Certs"
              "Config_DNS"
              "Status_Self"
              "OAuth_ClaimCheck"
            ];
          };
        };
      };
    };
}
