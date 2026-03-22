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
  imports = [
    ./quadlet.nix
    ./it-tools.nix
    ./caddy.nix
    ./kanidm.nix
    ./restic.nix
    ./openwebui.nix
    ./radius.nix
    ./home-assistant.nix
    ./postgres.nix
    ./planka.nix
    ./step-ca.nix
    ./minecraft-servers
    ./openssh.nix
  ];

  services.getty.autologinUser = "jacob";

  services.tailscale.enable = true;

  environment.etc."sysctl.d/99-tailscale.conf".text = ''
    net.ipv4.ip_forward = 1
    net.ipv6.conf.all.forwarding = 1
  '';

  services.xserver.xkb = {
    layout = "us";
    variant = "";
  };
}
