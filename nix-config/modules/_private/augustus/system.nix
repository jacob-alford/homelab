{ lib, config, pkgs, ... }:
{
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  boot.kernelPackages = pkgs.linuxPackages_latest;

  networking.networkmanager.enable = true;

  environment.sessionVariables = {
    CA_URL = "https://ca.plato-splunk.media";
    CA_FINGERPRINT = "56c220018d0c65d5283d46d7c769eb471c18b2e903b205a9457261b2c52f2392";
  };

  services.resolved = {
    enable = true;
    dnssec = "true";
    domains = [ "~." ];
    dnsovertls = "true";
    fallbackDns = [
      "45.90.28.103"
      "45.90.30.103"
    ];
    extraConfig = ''
      DNS=45.90.28.0#augustus-cbc883.dns.nextdns.io
      DNS=2a07:a8c0::#augustus-cbc883.dns.nextdns.io
      DNS=45.90.30.0#augustus-cbc883.dns.nextdns.io
      DNS=2a07:a8c1::#augustus-cbc883.dns.nextdns.io
      DNSOverTLS=yes
    '';
  };

  time.timeZone = "America/Denver";

  i18n.defaultLocale = "en_US.UTF-8";

  i18n.extraLocaleSettings = {
    LC_ADDRESS = "en_US.UTF-8";
    LC_IDENTIFICATION = "en_US.UTF-8";
    LC_MEASUREMENT = "en_US.UTF-8";
    LC_MONETARY = "en_US.UTF-8";
    LC_NAME = "en_US.UTF-8";
    LC_NUMERIC = "en_US.UTF-8";
    LC_PAPER = "en_US.UTF-8";
    LC_TELEPHONE = "en_US.UTF-8";
    LC_TIME = "en_US.UTF-8";
  };

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

  nixpkgs.config.allowUnfree = true;

  system.stateVersion = "25.05";
}
