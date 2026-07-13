{ config, ... }:
let
  c = config.constants;
  svc = c.services.tempo;
in
{
  flake.modules.nixos.tempo =
    { config, lib, pkgs, ... }:
    {
      services.tempo = {
        enable = true;
        settings = {
          server = {
            http_listen_port = svc.port;
            http_listen_address = "127.0.0.1";
            grpc_listen_port = 9095;
            grpc_listen_address = "127.0.0.1";
          };

          distributor = {
            receivers = {
              otlp = {
                protocols = {
                  grpc = {
                    endpoint = "127.0.0.1:${toString svc.grpcPort}";
                    # Kanidm startup can produce large spans
                    max_recv_msg_size_mib = 20;
                  };
                };
              };
            };
          };

          storage = {
            trace = {
              backend = "local";
              local = {
                path = "${svc.stateDir}/traces";
              };
              wal = {
                path = "${svc.stateDir}/wal";
              };
            };
          };

          compactor = {
            compaction = {
              block_retention = "72h";
            };
          };
        };
      };

      services.failure-notifs.attachServices = [ "tempo" ];
    };
}
