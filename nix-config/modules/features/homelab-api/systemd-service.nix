{ config, ... }:
let
  c = config.constants;
in
{
  flake.modules.nixos.homelabd =
    {
      inputs,
      config,
      lib,
      pkgs,
      ...
    }:
    let
      cfg = config.services.homelab-api;
      homeDir = cfg.userHomeDir;
      pubJwk = "${homeDir}/jwk.pub.json";
      privJwk = "${homeDir}/jwk.json";
      svc = config.constants.services.homelab-api;
      pkg = inputs.self.packages.x86_64-linux.homelab-api;
      preStartScript = pkgs.writeShellScript "post-start" ''
        set -euo pipefail

        if[[ ! -f ${pubJwk} ]]; then
          if [[ ! -f ${privJwk} ]]; then
            step crypto jwk create ${pubJwk} ${privJwk} --use sig --kty OKP --crv Ed25519 --password-file ${cfg.privateKeySecretPath}
          fi
        fi


      '';
    in
    {
      options.services.homelab-api = {
        enable = lib.mkEnableOption "Homelab API Server";

        pkg = lib.mkPackageOption "homelab-api" {
          description = "The homelab-api package to use";
          default = pkg;
        };

        originUrl = lib.mkOption {
          type = lib.types.str;
          description = "The domain of the API server";
        };

        userName = lib.mkOption {
          type = lib.types.nullOr lib.types.str;
          description = "The system user for homelab";
          default = "homelab-api";
        };

        userGid = lib.mkOption {
          type = lib.types.nullOr lib.types.int;
          description = "The user's GID for the homelab server service";
          default = 26696;
        };

        userUid = lib.mkOption {
          type = lib.types.nullOr lib.types.int;
          description = "The user's UID for the homelab server service";
          default = 26697;
        };

        userHomeDir = lib.mkOption {
          type = lib.types.nullOr lib.types.str;
          description = "The absolute path of the homelab server user's home directory";
          default = "/var/lib/${cfg.services.userName}";
        };

        provisionJwks = lib.mkOption {
          type = lib.types.nullOr lib.types.bool;
          description = "Enables construction of a private and public JWK pair for the token issuer.";
          default = true;
        };

        hmacSecretPath = lib.mkOption {
          type = lib.types.nullOr lib.types.str;
          description = "a path to the HMAC secret";
          default = null;
        };

        privateKeySecretPath = lib.mkOption {
          type = lib.types.nullOr lib.types.str;
          description = "a path to the private key encryption key";
          default = null;
        };

        featureFlags = lib.mkOption {
          type = lib.types.nullOr (lib.types.listOf lib.types.str);
          default = [ ];
          description = "The enabled feature flags for the service";
        };

        apiKeys = lib.mkOption {
          type = lib.types.listOf (
            lib.types.attrOf (
              lib.types.submodule {
                options = {
                  apiKeyFile = lib.types.mkOption {
                    type = lib.types.path;
                    description = "The path to this API key's file";
                  };
                  email = lib.types.mkOption {
                    type = lib.types.string;
                    description = "The email associated with this user's API key";
                  };
                  permissions = lib.types.mkOption {
                    type = lib.types.nonEmptyListOf (
                      lib.types.enum [
                        "Config_Wifi"
                        "Config_ACME"
                        "Config_Certs"
                        "Status_Health"
                        "OAuth_Token"
                      ]
                    );
                  };
                };
              }
            )
          );
          default = [ ];
          description = "The file containing the API keys for the local token issuer";
        };
      };

      config = lib.mkIf cfg.enable {
        assertions = [
          {
            assertion =
              cfg.provisionJwks
              -> cfg.apiKeysFile != null && cfg.privateKeySecretPath != null && cfg.hmacSecretPath != null;
            message = ''
              <option>services.homelab-api.apiKeysFile</option>, <option>services.homelab-api.privateKeySecretPath</option>, 
              and <option>services.homelab-api.hmacSecretPath</option> must be set when provisioning JWKs 
            '';
          }
        ];

        users.groups."${cfg.userName}" = {
          gid = cfg.userGid;
        };

        users.users."${cfg.userName}" = {
          uid = cfg.userUid;
          isSystemUser = true;
          group = cfg.userGid;
          home = cfg.userHomeDir;
        };

        sops.templates."homelab-api-env" = {
          owner = cfg.user;
          group = cfg.user;
          content = ''
            PORT=${builtins.toString svc.port}

            ROOT_CERT_DER=${c.ca.rootCertDer}
            INTERMEDIATE_CERT_DER=${c.ca.intermediateCertDer}

            HOMELAB_ORIGIN_URL=${cfg.originUrl}

            ${if cfg.provisionJwks then "TOKEN_ISSUER_PRIVATE_KEY_PATH=${privJwk}" else ""}
            ${if cfg.provisionJwks then "TOKEN_ISSUER_PUBLIC_KEY_PATH=${pubJwk}" else ""}
            ${
              if cfg.provisionJwks then "TOKEN_ISSUER_PRIVATE_KEY_SECRET_PATH=${cfg.privateKeySecretPath}" else ""
            }
            ${if cfg.provisionJwks then "HOMELAB_SECRET_FILE=${cfg.hmacSecretPath}" else ""}
            ${if cfg.provisionJwks then "API_KEYS_FILE=${cfg.apiKeysFile}" else ""}

            FEATURE_FLAGS=${lib.concatStringsSep "," cfg.featureFlag}
            KANIDM_OPENID_PROVIDER_URL=${svc.oidcEndpoint}

            CA_URL=${c.ca.url}
            ACME_DIRECTORY_PATH=/acme/acme/directory
            ACME_HARDWARE_BOUND=true
            ACME_KEY_TYPE=ECSECPrimeRandom
            ACME_KEY_SIZE=384
          '';
        };

        systemd.services.homelab-api = {
          description = "Homelab API NodeJS Server";

          after = [ "network-online.target" ];
          wants = [ "network-online.target" ];
          wantedBy = [ "multi-user.target" ];

          serviceConfig = {
            Type = "simple";
            User = cfg.user;
            Group = cfg.user;
            EnvironmentFile = config.sops.templates."homelab-api-env".path;

            ExecStart = "${pkg}/bin/homelab-api";
            ExecStartPre = lib.mkIf cfg.provisionJwks preStartScript;

            Restart = "on-failure";
            RestartSec = 5;
            CapabilityBoundingSet = [ ];
            DeviceAllow = "";
            LockPersonality = true;
            MemoryDenyWriteExecute = true;
            NoNewPrivileges = true;
            PrivateDevices = true;
            PrivateMounts = true;
            PrivateNetwork = true;
            PrivateTmp = true;
            PrivateUsers = true;
            ProcSubset = "pid";
            ProtectClock = true;
            ProtectHome = true;
            ProtectHostname = true;
            ProtectSystem = "strict";
            ProtectControlGroups = true;
            ProtectKernelLogs = true;
            ProtectKernelModules = true;
            ProtectKernelTunables = true;
            ProtectProc = "invisible";
            RestrictAddressFamilies = [ ];
            RestrictNamespaces = true;
            RestrictRealtime = true;
            RestrictSUIDSGID = true;
            SystemCallArchitectures = "native";
          };
        };
      };
    };
}
