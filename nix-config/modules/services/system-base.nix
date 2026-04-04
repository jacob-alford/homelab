{ inputs, ... }:
{
  flake.modules.nixos.system-base = {
    imports = with inputs.self.modules.nixos; [
      nix-settings
      openssh
      ssh-cert-renewer
    ];
  };
}
