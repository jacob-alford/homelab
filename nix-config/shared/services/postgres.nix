{ inputs
, outputs
, lib
, config
, pkgs
, pkgs-unstable
, ...
}:
let
  cfg = config.services.peesequel;
  inherit (cfg) package dataDir;
  acmePort = 41872;
  domain = cfg.tlsDomain;
  inherit (config.security.acme.certs."${domain}") directory;

  # Shared path constants
  postgresCredsDir = "/var/lib/postgresql/certs";
  certFiles = {
    fullchain = "fullchain.pem";
    key = "key.pem";
    chain = "chain.pem";
    rootCA = "root-ca.pem";
  };

  # Certificate update script
  updateCertsScript = pkgs.writeShellScript "update-postgres-certs" ''
    set -euo pipefail

    # Create credentials directory if it doesn't exist
    mkdir -p ${postgresCredsDir}

    # Copy certificate files from ACME directory
    cp ${directory}/${certFiles.fullchain} ${postgresCredsDir}/${certFiles.fullchain}
    cp ${directory}/${certFiles.key} ${postgresCredsDir}/${certFiles.key}
    cp ${directory}/${certFiles.chain} ${postgresCredsDir}/${certFiles.chain}
    cp /etc/ssl/certs/ca-certificates.crt ${postgresCredsDir}/${certFiles.rootCA}

    # Set ownership to postgres
    chown postgres:postgres ${postgresCredsDir}/${certFiles.fullchain}
    chown postgres:postgres ${postgresCredsDir}/${certFiles.key}
    chown postgres:postgres ${postgresCredsDir}/${certFiles.chain}
    chown postgres:postgres ${postgresCredsDir}/${certFiles.rootCA}

    # Set appropriate permissions (key should be readable only by postgres)
    chmod 644 ${postgresCredsDir}/${certFiles.fullchain}
    chmod 600 ${postgresCredsDir}/${certFiles.key}
    chmod 644 ${postgresCredsDir}/${certFiles.chain}
    chmod 644 ${postgresCredsDir}/${certFiles.rootCA}

    echo "Successfully updated PostgreSQL certificates"
  '';
in
{
  options.services.peesequel = {
    enable = lib.mkEnableOption "PostgreSQL server with custom configuration";

    package = lib.mkOption {
      type = lib.types.package;
      default = pkgs.postgresql_17_jit;
      description = "PostgreSQL package to use";
    };

    dataDir = lib.mkOption {
      type = lib.types.str;
      default = "/var/lib/postgresql/${config.services.postgresql.package.psqlSchema}";
      description = "Data directory for PostgreSQL";
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 5432;
      description = "Port for PostgreSQL to listen on";
    };

    maxConnections = lib.mkOption {
      type = lib.types.int;
      default = 100;
      description = "Maximum number of concurrent connections";
    };

    ensureDatabases = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [ ];
      description = "List of databases to ensure exist";
    };

    ensureUsers = lib.mkOption {
      type = lib.types.listOf lib.types.attrs;
      default = [ ];
      description = "List of users to ensure exist";
    };

    enableBackup = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Enable PostgreSQL backups";
    };

    backupLocation = lib.mkOption {
      type = lib.types.str;
      default = "/var/backup/postgresql";
      description = "Location for PostgreSQL backups";
    };

    additionalSettings = lib.mkOption {
      type = lib.types.attrs;
      default = { };
      description = "Additional PostgreSQL settings";
    };

    tlsDomain = lib.mkOption {
      type = lib.types.str;
      description = "The domain for the Postgres server's TLS cert";
    };

    provisionPasswords = lib.mkOption {
      type = lib.types.attrsOf lib.types.str;
      default = { };
      description = "Attribute set of username to password file path for provisioning user passwords";
    };
  };

  config = lib.mkIf cfg.enable {
    services.postgresql = {
      inherit package dataDir;
      enable = true;

      inherit (cfg) ensureDatabases ensureUsers;

      settings = lib.mkMerge [
        {
          port = cfg.port;
          max_connections = cfg.maxConnections;

          # Listen on all interfaces for TCP connections
          listen_addresses = lib.mkForce "0.0.0.0,::";

          # Security defaults
          log_connections = true;
          log_statement = "all";
          logging_collector = true;
          log_disconnections = true;
          log_destination = lib.mkForce "syslog";

          # TLS configuration
          ssl = true;
          ssl_cert_file = "${postgresCredsDir}/${certFiles.fullchain}";
          ssl_key_file = "${postgresCredsDir}/${certFiles.key}";
          ssl_ca_file = "${postgresCredsDir}/${certFiles.rootCA}";
        }
        cfg.additionalSettings
      ];

      identMap = ''
        # ArbitraryMapName systemUser          DBUser
          superuser_map      root                postgres
          superuser_map      postgres            postgres
        # Let other names login as themselves
          superuser_map      /^(.*)$             \1
        # Map certificate CN (subdomain.domain.tld) to subdomain username
          cert_map           /^([^.]+)\.plato-splunk\.media$  \1
      '';

      authentication = lib.mkForce ''
        # TYPE  DATABASE        USER            ADDRESS                 METHOD   OPTIONS

        # "local" is for Unix domain socket connections only
        # Superuser access for trusted users
          local   all             postgres                                peer     map=superuser_map
        # Other users restricted to their own database via peer authentication
          local   sameuser        all                                     peer     map=superuser_map

        # Network connections with SSL required
        # Password authentication over SSL for localhost:
          hostssl sameuser        all             127.0.0.1/32            scram-sha-256
          hostssl sameuser        all             ::1/128                 scram-sha-256
        # Client certificate authentication over SSL for remote:
          hostssl sameuser        all             0.0.0.0/0               cert     map=cert_map
          hostssl sameuser        all             ::/0                    cert     map=cert_map

        # Allow replication connections from localhost, by a user with the
        # replication privilege.
        #  local   replication     all                                     trust
        #  hostssl replication     all             127.0.0.1/32            cert
        #  hostssl replication     all             ::1/128                 cert
      '';
    };

    # Provision user passwords
    systemd.services.postgresql-provision-passwords = lib.mkIf (cfg.enable && cfg.provisionPasswords != { }) {
      description = "Provision PostgreSQL user passwords";
      after = [ "postgresql.service" ];
      wantedBy = [ "multi-user.target" ];
      requires = [ "postgresql.service" ];

      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        User = "postgres";
      };

      script = lib.concatStringsSep "\n" (lib.mapAttrsToList
        (user: passwordFile: ''
          # Use parameterized password file to avoid shell injection
          ${config.services.postgresql.package}/bin/psql -v "ON_ERROR_STOP=1" -c "ALTER USER $(${pkgs.coreutils}/bin/printf '%s' ${lib.escapeShellArg user} | ${pkgs.gnused}/bin/sed 's/[^a-zA-Z0-9_-]//g') WITH PASSWORD \$\$$(${pkgs.coreutils}/bin/cat ${lib.escapeShellArg passwordFile})\$\$;"
        '')
        cfg.provisionPasswords);
    };

    # Certificate update service - runs after ACME renewal
    systemd.services.postgresql-update-certs = lib.mkIf cfg.enable {
      description = "Update PostgreSQL TLS certificates from ACME";
      after = [ "acme-${domain}.service" ];
      wantedBy = [ "multi-user.target" ];

      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = false;
        User = "root";
        ExecStart = updateCertsScript;
        ExecStartPost = "${pkgs.systemd}/bin/systemctl restart postgresql.service";
      };
    };

    services.postgresqlBackup = lib.mkIf cfg.enableBackup {
      enable = true;
      backupAll = true;
      location = cfg.backupLocation;
    };

    # ACME forwarder for postgres certificate
    services.caddy.virtualHosts."http://${domain}" = lib.mkIf cfg.enable {
      extraConfig = ''
        reverse_proxy localhost:${builtins.toString acmePort}
      '';
    };

    users.groups.postgres-certs = lib.mkIf cfg.enable {
      members = [ "postgres" ];
    };

    security.acme.certs."${domain}" = lib.mkIf cfg.enable {
      inherit domain;
      listenHTTP = "127.0.0.1:${builtins.toString acmePort}";
      server = "https://ca.plato-splunk.media/acme/acme/directory";
      group = "postgres-certs";
      postRun = "${pkgs.systemd}/bin/systemctl start postgresql-update-certs.service";
    };
  };
}
