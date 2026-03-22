{
  inputs,
  outputs,
  lib,
  config,
  pkgs,
  pkgs-unstable,
  ...
}:
{
  security.sudo.execWheelOnly = true;

  security.pki.certificateFiles = [ ../../../certs/alford-root.crt ];

  networking.firewall = {
    enable = true;

    interfaces = {
      tailscale0 = {
        allowedTCPPorts = [
          22
          5432
          25565
        ];
      };
    };

    allowedTCPPorts = [
      80
      443

      # ESPHome
      # 6053

      # radius
      1812
      1813
    ];
  };
}
