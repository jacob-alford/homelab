{ ... }:
{
  flake.modules.nixos.uxplay =
    { pkgs, ... }:
    {
      services.avahi = {
        enable = true;
        nssmdns4 = true;
        publish = {
          enable = true;
          userServices = true;
          addresses = true;
          workstation = true;
        };
        openFirewall = true;
      };

      systemd.services.uxplay = {
        description = "UxPlay AirPlay Mirror Server";
        after = [ "avahi-daemon.service" ];
        wantedBy = [ ];

        environment = {
          XDG_RUNTIME_DIR = "/run/user/1000";
        };

        serviceConfig = {
          ExecStart = "${pkgs.uxplay}/bin/uxplay -n nixos -fps 60 -vs waylandsink -p 49545,58042,56503";
          Restart = "on-failure";
          User = "jacob";
        };
      };
    };
}
