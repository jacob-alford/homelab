{
  flake.modules.nixos.nvidia =
    { config, lib, pkgs, ... }:
    {
      services.xserver.videoDrivers = [ "nvidia" ];

      hardware.graphics = {
        enable = true;
        enable32Bit = true;
      };

      hardware.nvidia = {
        modesetting.enable = true;
        powerManagement.enable = true;
        powerManagement.finegrained = false;
        open = true;

        nvidiaSettings = false;

        package = config.boot.kernelPackages.nvidiaPackages.mkDriver {
          version = "595.45.04";
          sha256_64bit = "sha256-zUllSSRsuio7dSkcbBTuxF+dN12d6jEPE0WgGvVOj14=";
          openSha256 = "sha256-uqNfImwTKhK8gncUdP1TPp0D6Gog4MSeIJMZQiJWDoE=";
          settingsSha256 = "";
          persistencedSha256 = "";
        };
      };
    };
}
