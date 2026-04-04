{ inputs, lib, config, pkgs, ... }:
{
  security.sudo.execWheelOnly = true;

  security.rtkit.enable = true;

  security.pki.certificateFiles = [ (inputs.self + "/certs/alford-root.crt") ];

  networking.firewall = {
    enable = true;
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

  services.openssh = {
    openFirewall = false;
    settings = {
      PermitRootLogin = "no";
      X11Forwarding = false;
    };
  };

  programs.ssh = {
    startAgent = true;
    enableAskPassword = true;
  };

  services.ssh-cert-renewer = {
    sshKeyName = "ssh_host_ed25519_key";
    enable = true;
    serviceName = "nixos.plato-splunk.media";
    passwordFile = config.sops.secrets.step_jwk_provisioner_password.path;
  };
}
