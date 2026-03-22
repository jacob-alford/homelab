{
  inputs,
  outputs,
  lib,
  config,
  pkgs,
  pkgs-unstable,
  ...
}:
let
  domain = "https://dev-tools.plato-splunk.media";
  port = 47309;
in
{
  virtualisation.oci-containers.containers = {
    it-tools = {
      image = "sharevb/it-tools:latest";
      ports = [ "127.0.0.1:${builtins.toString port}:8080" ];
    };
  };

  services.caddy.virtualHosts."${domain}" = {
    extraConfig = ''
      reverse_proxy localhost:${builtins.toString port}
    '';
  };
}
