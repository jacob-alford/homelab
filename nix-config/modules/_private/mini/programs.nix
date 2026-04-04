{ inputs, lib, config, pkgs, ... }:
{
  programs.zsh = {
    enable = true;
    enableCompletion = true;
    enableSyntaxHighlighting = true;
  };

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

  system.configurationRevision = inputs.self.rev or inputs.self.dirtyRev or null;

  system.primaryUser = "jacob";

  system.stateVersion = 6;

  nixpkgs.hostPlatform = "aarch64-darwin";

  nixpkgs.config.allowUnfree = true;
  nixpkgs.config.allowUnfreePredicate = pkg:
    builtins.elem (lib.getName pkg) [
    ];
}
