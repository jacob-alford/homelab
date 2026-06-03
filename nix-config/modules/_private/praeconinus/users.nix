{ pkgs, ... }:
{
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
  };
}
