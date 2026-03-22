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

  security.rtkit.enable = true;

  security.pki.certificateFiles = [ ../../certs/alford-root.crt ];

  networking.firewall = {
    enable = true;
    # PORT for Whisper and Pipe (Wyoming)
    allowedTCPPorts = [
      10300
      10200
    ];

    interfaces = {
      tailscale0 = {
        allowedTCPPorts = [ 22 ];
      };
    };
  };
}
