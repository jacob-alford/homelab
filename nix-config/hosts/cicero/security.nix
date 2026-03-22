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

  # Enable PC/SC daemon for YubiKey support
  services.pcscd.enable = true;

  # Allow all processes to access PC/SC for YubiKey
  security.polkit.extraConfig = ''
    polkit.addRule(function(action, subject) {
      if (action.id == "org.debian.pcsc-lite.access_card") {
        return polkit.Result.YES;
      }
    });

    polkit.addRule(function(action, subject) {
      if (action.id == "org.debian.pcsc-lite.access_pcsc") {
        return polkit.Result.YES;
      }
    });
  '';

  networking.firewall = {
    enable = true;

    interfaces = {
      tailscale0 = {
        allowedTCPPorts = [
          22
          443
        ];
      };
    };
  };
}
