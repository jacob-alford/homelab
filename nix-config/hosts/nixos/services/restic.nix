{ pkgs, ... }:
{

  # Prevents restic from running as root,
  # but allows reading any file
  security.wrappers.restic = {
    program = "restic";
    source = "${pkgs.restic.out}/bin/restic";
    owner = "restic";
    group = "users";
    permissions = "u=rwx,g=,o=";
    capabilities = "cap_dac_read_search=+ep";
  };
}
