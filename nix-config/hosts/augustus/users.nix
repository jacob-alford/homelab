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
  users.groups = {
    radiusd = {
      gid = 222;
    };
    hass = {
      gid = config.ids.gids.hass;
    };
    planka = {
      gid = 10666;
    };
    planka-certs = {
      gid = 11666;
    };
    planka-db-pass = {
      gid = 12666;
    };
  };

  users.users = {
    jacob = {
      isNormalUser = true;
      description = "Jacob Alford";
      extraGroups = [
        "networkmanager"
        "wheel"
      ];
      packages = with pkgs; [ ];
      openssh.authorizedPrincipals = [
        "jacob@plato-splunk.media"
      ];
      openssh.authorizedKeys.keys = [
        "sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIKpkbeZ6o6dX4eTh/Ak1i9rnb41XohfQdUISJ9QQepnkAAAABHNzaDo="
      ];
      shell = pkgs.zsh;
    };
    restic = {
      isNormalUser = true;
    };
    radiusd = {
      isSystemUser = true;
      group = "radiusd";
      uid = 222;
    };
    hass = {
      home = "/var/lib/hass";
      createHome = true;
      group = "hass";
      uid = config.ids.uids.hass;
    };
    planka = {
      isSystemUser = true;
      home = "/var/lib/planka";
      group = "planka";
      uid = 10666;
    };
  };
}
