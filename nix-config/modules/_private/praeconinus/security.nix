{ inputs, lib, config, pkgs, ... }:
{
  security.sudo.execWheelOnly = true;

  security.pki.certificateFiles = [ (inputs.self + "/certs/alford-root.crt") ];

  networking.firewall = {
    enable = true;

    interfaces = {
      tailscale0 = {
        allowedTCPPorts = [ 443 ];
      };
    };

    allowedTCPPorts = [ 22 ];
  };

  services.openssh.openFirewall = false;
}
