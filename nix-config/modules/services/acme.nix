{ config, ... }:
let
  c = config.constants;
in
{
  flake.modules.nixos.acme =
    { ... }:
    {
      security.acme = {
        acceptTerms = true;
        defaults.email = c.acme.email;
        defaults.server = c.ca.acmeDirectory;
        defaults.listenHTTP = "127.0.0.1:1360";
      };
    };
}
