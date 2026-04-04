{ config, ... }:
let
  c = config.constants;
  svc = c.services.radius;
  containerName = "radiusd";
in
{
  flake.modules.nixos.radius =
    { config, lib, pkgs, ... }:
    let
      caCert = config.environment.etc."ssl/certs/ca-certificates.crt".source;
      inherit (config.security.acme.certs."${svc.domain}") directory;
    in
    {
      virtualisation.oci-containers.containers."${containerName}" = {
        user = "root";
        image = "kanidm/radius:latest";
        ports = [
          "0.0.0.0:1812:1812"
          "0.0.0.0:1812:1812/udp"
          "0.0.0.0:1813:1813"
          "0.0.0.0:1813:1813/udp"
        ];
        environment = {
          RADIUS_USER = "222:222";
          DEBUG = "True";
          REQUESTS_CA_BUNDLE = "/data/ca.pem";
        };
        volumes = [
          "${caCert}:/etc/pki/ca-trust/source/anchors"
          "${caCert}:/data/ca.pem"
          "${directory}/fullchain.pem:/data/cert.pem"
          "${directory}/key.pem:/data/key.pem"
          "${config.sops.templates."radius_config".path}:/data/radius.toml:Z"
        ];
      };

      security.acme.certs."${svc.domain}" = {
        domain = svc.domain;
        group = "radiusd";
        server = c.ca.acmeDirectory;
        listenHTTP = "127.0.0.1:${builtins.toString svc.acmePort}";
        reloadServices = [ "podman-${containerName}.service" ];
      };

      services.caddy.virtualHosts."http://${svc.domain}" = {
        extraConfig = ''
          reverse_proxy localhost:${builtins.toString svc.acmePort}
        '';
      };

      sops.templates."radius_config" = {
        owner = "radiusd";
        content = ''
          uri = "${c.idm.url}"
          verify_hostnames = true
          verify_ca = true
          ca_path = "/data/ca.pem"

          auth_token = "${config.sops.placeholder.ui_radius_auth_token}"

          radius_default_vlan = 45

          radius_required_groups = ["radius.access@${c.idm.domain}"]

          radius_groups = [
            { spn = "radius.access_guest@${c.idm.domain}", vlan = 45 },
            { spn = "radius.access_home@${c.idm.domain}", vlan = 55 },
            { spn = "radius.access_private@${c.idm.domain}", vlan = 100 }
          ]

          radius_clients = [
            { name = "u6e", ipaddr = "10.10.0.122", secret = "${config.sops.placeholder.unifi_radius_secret}" },
            { name = "udmp", ipaddr = "10.10.0.1", secret = "${config.sops.placeholder.unifi_radius_secret}" }
          ]

          radius_cert_path = "/data/cert.pem"
          radius_key_path = "/data/key.pem"
          radius_ca_path = "/data/ca.pem"
        '';
      };
    };
}
