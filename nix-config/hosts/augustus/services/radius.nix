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
  domain = "radius.plato-splunk.media";
  containerName = "radiusd";
  caCert = config.environment.etc."ssl/certs/ca-certificates.crt".source;
  acmePort = 22378;
  inherit (config.security.acme.certs."${domain}") directory;
in
{
  virtualisation.oci-containers.containers."${containerName}" = {
    # TODO: de-root
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

  security.acme.certs."${domain}" = {
    inherit domain;
    group = "radiusd";
    server = "https://ca.plato-splunk.media/acme/acme/directory";
    listenHTTP = "127.0.0.1:${builtins.toString acmePort}";
    reloadServices = [ "podman-${containerName}.service" ];
  };

  # ACME forwarders

  services.caddy.virtualHosts."http://${domain}" = {
    extraConfig = ''
      reverse_proxy localhost:${builtins.toString acmePort}
    '';
  };

  sops.templates."radius_config" = {
    owner = "radiusd";
    content = ''
      uri = "https://idm.plato-splunk.media"
      verify_hostnames = true
      verify_ca = true
      ca_path = "/data/ca.pem"

      auth_token = "${config.sops.placeholder.ui_radius_auth_token}"

      radius_default_vlan = 45

      radius_required_groups = ["radius.access@idm.plato-splunk.media"]

      radius_groups = [
        { spn = "radius.access_guest@idm.plato-splunk.media", vlan = 45 },
        { spn = "radius.access_home@idm.plato-splunk.media", vlan = 55 },
        { spn = "radius.access_private@idm.plato-splunk.media", vlan = 100 }
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
}
