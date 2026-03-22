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
  services.minecraft-servers.servers.vanilla = {
    enable = true;
    jvmOpts = "-Xmx8G -Xms4G";
    package = pkgs.fabricServers.fabric-1_21_10;
    whitelist = {
      jacob_alford = "dfb56ab8-5441-4165-be4f-27f8e6e31ac4";
      Ryan_In_Reverie = "dab38f2e-0d4d-4c9f-8e4f-3fc1c23d9a42";
      squish37 = "f05a273f-26b2-4e38-95d9-b630416a24db";
    };
    serverProperties = {
      server-port = 25565;
      difficulty = 2;
      gamemode = 0;
      max-players = 12;
      motd = "§dThe Best§r§1 §r§5§kabcdefg§r§1 server§r";
      white-list = true;
      allow-cheats = false;
      enforce-whitelist = true;
    };
  };
}
