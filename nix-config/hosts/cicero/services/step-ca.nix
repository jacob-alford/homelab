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
  domain = "ca.plato-splunk.media";
  postgresHost = "postgres-augustus.plato-splunk.media";
  clientId = "step-ca";

  rootCert = ../../../../certs/alford-root.crt;
  intermediateCert = ../../../../certs/intermediate_ca_2.crt;

  dbClientCert = "/var/lib/step-ca/certs/db-client.crt";
  dbClientKey = "/var/lib/step-ca/certs/db-client.key";
in
{
  services.step-ca = {
    enable = true;
    address = "0.0.0.0";
    port = 443;
    openFirewall = false;
    intermediatePasswordFile = config.sops.secrets.intermediate_crt_password.path;

    settings = {
      root = rootCert;
      crt = intermediateCert;
      key = "yubikey:slot-id=9c";

      insecureAddress = "";

      dnsNames = [ domain ];

      kms = {
        type = "yubikey";
        uri = "yubikey:pin-source=${config.sops.templates."yk-pin.txt".path}";
      };

      logger = {
        format = "text";
      };

      # Use BadgerDB for now - will migrate to PostgreSQL after bootstrapping mTLS cert
      # TODO: Once db-client.crt/key are issued via ACME, switch to PostgreSQL:
      # db = {
      #   type = "postgresql";
      #   dataSource = "postgresql:///step-ca?host=${postgresHost}&sslmode=verify-full&sslcert=${dbClientCert}&sslkey=${dbClientKey}&sslrootcert=${rootCert}";
      # };
      db = {
        type = "badgerv2";
        dataSource = "/var/lib/step-ca/db";
      };

      ssh = {
        hostKey = "yubikey:slot-id=82";
        userKey = "yubikey:slot-id=83";
      };

      authority = {
        policy = {
          x509 = {
            allow = {
              dns = [ "*.plato-splunk.media" ];
              email = [ "@plato-splunk.media" ];
            };
            deny = {
              dns = [
                "postgres.plato-splunk.media"
                "root.plato-splunk.media"
              ];
              email = [
                "postgres@plato-splunk.media"
                "root@plato-splunk.media"
              ];
            };
            allowWildcardNames = false;
          };
          ssh = {
            host = {
              allow = {
                dns = [ "*.plato-splunk.media" ];
              };
              deny = {
                dns = [
                  "postgres.plato-splunk.media"
                  "root.plato-splunk.media"
                ];
              };
            };
            user = {
              allow = {
                principal = [ "*" ];
                email = [ "@plato-splunk.media" ];
              };
              deny = {
                principal = [
                  "postgres"
                  "root"
                ];
                email = [
                  "postgres@plato-splunk.media"
                  "root@plato-splunk.media"
                ];
              };
            };
          };
        };
        provisioners = [
          {
            type = "ACME";
            name = "acme";
            forceCN = true;
            challenges = [
              "http-01"
              "dns-01"
              "tls-alpn-01"
              "device-attest-01"
            ];
            claims = {
              disableRenewal = false;
              allowRenewalAfterExpiry = false;
              disableSmallstepExtensions = false;
            };
            options = {
              x509 = { };
            };
          }
          {
            type = "SSHPOP";
            name = "sshpop";
            claims = {
              enableSSHCA = true;
            };
          }
          {
            type = "OIDC";
            name = "kanidm";
            clientID = clientId;
            # Client Secret is "public" anywho
            # https://smallstep.com/docs/step-ca/provisioners/#notes
            # Really no way around it unfortunately
            clientSecret = "Fb6vJKX4DcxFxRY4DpFJtkAtXv9fGH2rkewYBJmJWmK8xq6PLT4xyHHaQzmxksGLjH9rGWsJarEeGo4nRbQGNkmfJQpvnrjW38bM";
            listenAddress = "127.0.0.1:10000";
            configurationEndpoint = "https://idm.plato-splunk.media/oauth2/openid/${clientId}/.well-known/openid-configuration";
            domains = [ "plato-splunk.media" ];
            claims = {
              enableSSHCA = true;
              defaultUserSSHCertDuration = "2h";
            };
          }
          {
            type = "JWK";
            name = "augustus.plato-splunk.media";
            key = {
              "use" = "sig";
              "kty" = "EC";
              "kid" = "7_wfaqwbLk94as2f7jKmvXs3yr51bDgLLdXgLRX_pu4";
              "crv" = "P-256";
              "alg" = "ES256";
              "x" = "W4yiQ8BzNA76ehZeIK3cmHY4BlsoTHLdTrpR3-qBQ3E";
              "y" = "vCnEkPmAyxHGOJPDc2hC-YqeDlF1rFwFpmW_efYaMSs";
            };
            claims = {
              enableSSHCA = true;
            };
          }
          {
            type = "JWK";
            name = "cicero.plato-splunk.media";
            key = {
              "use" = "sig";
              "kty" = "EC";
              "kid" = "v3TMvBAmYNVhlOXOEIKOVLrEXqaPFPmoTsWVAWZNUuI";
              "crv" = "P-256";
              "alg" = "ES256";
              "x" = "TNcsQAP1zbr6sFxG6SQMCn8vi10Ejm5VeYiFC90fhEM";
              "y" = "Nh7W4ufWYjyE7tQx8vxbYFVGiVQyDtFHMwTJuA94cB0";
            };
            claims = {
              enableSSHCA = true;
            };
          }
          {
            type = "JWK";
            name = "nixos.plato-splunk.media";
            key = {
              "use" = "sig";
              "kty" = "EC";
              "kid" = "a0gFjUpg-3LbloOKHC0KqxfAcTnyr8yV-b0gXb2QLDo";
              "crv" = "P-256";
              "alg" = "ES256";
              "x" = "bHB9No_-BM7vng2OasKbaV5vaF0owAnx5fCEee94dhc";
              "y" = "hI4jchAOkIl4AnaZWBZ8jOAxc-9ul4HkJPwmr6Qj-Pk";
            };
            claims = {
              enableSSHCA = true;
            };
          }
        ];
        template = { };
        backdate = "1m0s";
      };

      tls = {
        cipherSuites = [
          "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256"
          "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256"
        ];
        minVersion = 1.2;
        maxVersion = 1.3;
        renegotiation = false;
      };

      commonName = "Step Online CA";
    };
  };

  systemd.services.step-ca = {
    environment = {
      STEPPATH = "/var/lib/step-ca";
      PGSSLCERT = dbClientCert;
      PGSSLKEY = dbClientKey;
      PGSSLROOTCERT = toString rootCert;
      PGSSLMODE = "verify-full";
    };
  };
}
