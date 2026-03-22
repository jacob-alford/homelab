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
  sshKeyName = "ssh_host_ed25519_key";
in
{
  services.openssh = {
    enable = true;
    openFirewall = false;
    settings = {
      PermitRootLogin = "no";
      X11Forwarding = false;
      PasswordAuthentication = false;
      KbdInteractiveAuthentication = false;
      AllowUsers = [ "jacob" ];
      TrustedUserCAKeys = "${../../../certs/ssh_user_ca_key.pub}";
    };
    hostKeys = [
      {
        type = "ed25519";
        path = "/etc/ssh/${sshKeyName}";
      }
    ];
    extraConfig = ''
      HostCertificate /etc/ssh/${sshKeyName}-cert.pub
    '';
  };

  programs.ssh = {
    startAgent = true;
    enableAskPassword = true;
  };

  services.ssh-cert-renewer = {
    inherit sshKeyName;
    enable = true;
    serviceName = "nixos.plato-splunk.media";
    passwordFile = config.sops.secrets.step_jwk_provisioner_password.path;
  };
}
