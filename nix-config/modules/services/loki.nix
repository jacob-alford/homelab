{ config, ... }:
let
  c = config.constants;
  svc = c.services.loki;
in
{
  flake.modules.nixos.loki =
    {
      config,
      lib,
      pkgs,
      ...
    }:
    {
      services.loki = {
        enable = true;
        configuration = {
          auth_enabled = false;

          server = {
            http_listen_port = svc.port;
            http_listen_address = "127.0.0.1";
            grpc_listen_port = 9096;
            grpc_listen_address = "127.0.0.1";
          };

          common = {
            path_prefix = svc.stateDir;
            replication_factor = 1;
            instance_addr = "127.0.0.1";
            ring = {
              kvstore.store = "inmemory";
              instance_addr = "127.0.0.1";
            };
          };

          schema_config.configs = [
            {
              from = "2024-01-01";
              store = "tsdb";
              object_store = "filesystem";
              schema = "v13";
              index = {
                prefix = "index_";
                period = "24h";
              };
            }
          ];

          storage_config.filesystem.directory = "${svc.stateDir}/chunks";

          limits_config = {
            retention_period = "30d";
            allow_structured_metadata = true;
            volume_enabled = true;
          };

          compactor = {
            working_directory = "${svc.stateDir}/compactor";
            delete_request_store = "filesystem";
            retention_enabled = true;
          };
        };
      };

      systemd.services.loki.serviceConfig = {
        DynamicUser = lib.mkForce false;
        User = "loki";
        Group = "loki";
        StateDirectory = "loki";
      };

      users.users.loki = {
        isSystemUser = true;
        group = "loki";
        home = svc.stateDir;
      };

      users.groups.loki = { };

      services.failure-notifs.attachServices = [ "loki" ];
    };
}
