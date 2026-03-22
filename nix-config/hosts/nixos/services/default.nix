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
    ./ai.nix
    ./cifs.nix
    ./nvidia.nix
    ./restic.nix
    ./openssh.nix
    ./gnome.nix
    ./virtualization.nix
  ];

  ### Miscellaneous System Services ###

  services.tailscale.enable = true;

  services.printing.enable = true;

  services.pcscd.enable = true;

  services.pulseaudio.enable = false;

  services.avahi = {
    enable = true;
    nssmdns4 = true;
    openFirewall = true;
  };

  services.xserver.xkb = {
    layout = "us";
    variant = "";
  };

  services.pipewire = {
    enable = true;
    alsa.enable = true;
    alsa.support32Bit = true;
    pulse.enable = true;
  };
}
