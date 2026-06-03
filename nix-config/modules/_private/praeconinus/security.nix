{ inputs, lib, config, pkgs, ... }:
{
  security.sudo.execWheelOnly = true;

  security.pki.certificateFiles = [ (inputs.self + "/certs/alford-root.crt") ];

  networking.firewall = {
    enable = true;

    interfaces = {
      tailscale0 = {
        allowedTCPPorts = [ 22 443 ];
      };
    };

    allowedTCPPorts = [ 443 ];
  };

  services.openssh.openFirewall = false;
}
