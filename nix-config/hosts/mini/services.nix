{
  inputs,
  outputs,
  lib,
  config,
  pkgs,
  ...
}:
{
  # List packages installed in system profile. To search by name, run:
  # $ nix-env -qaP | grep wget
  environment.systemPackages = [
    pkgs.step-cli
  ];

  launchd.daemons.caddy = {
    command = "${pkgs.caddy}/bin/caddy run --config ${./Caddyfile} --adapter caddyfile";
    serviceConfig = {
      KeepAlive = true;
      RunAtLoad = true;
      StandardOutPath = "/etc/caddy/logs/caddy.info.log";
      StandardErrorPath = "/etc/caddy/logs/caddy.err.log";
    };
  };
}
