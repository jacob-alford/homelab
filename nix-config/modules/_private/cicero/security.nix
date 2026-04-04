{ inputs, lib, config, pkgs, ... }:
{
  security.sudo.execWheelOnly = true;

  security.pki.certificateFiles = [ (inputs.self + "/certs/alford-root.crt") ];

  services.pcscd.enable = true;

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

  services.openssh.openFirewall = true;

  services.ssh-cert-renewer = {
    sshKeyName = "ssh_host_ed25519_key";
    enable = true;
    serviceName = "cicero.plato-splunk.media";
    passwordFile = config.sops.secrets.step_jwk_provisioner_password.path;
  };
}
