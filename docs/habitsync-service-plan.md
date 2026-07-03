# Plan: HabitSync Service on Augustus

## Overview

Deploy [HabitSync](https://github.com/jofoerster/habitsync) as a containerized service on Augustus using podman (via `virtualisation.oci-containers`). HabitSync is a self-hostable habit tracking platform with social features, OIDC authentication, and PostgreSQL support.

## Service Details

| Property     | Value                                  |
| ------------ | -------------------------------------- |
| Service name | `habitsync`                            |
| Port         | `6842` (default HabitSync port)        |
| URL          | `https://habitsync.plato-splunk.media` |
| Container    | `ghcr.io/jofoerster/habitsync:latest`  |
| User/Group   | `habitsync` / `habitsync`              |
| State dir    | `/var/lib/habitsync`                   |
| Auth method  | OIDC public client (PKCE) via Kanidm   |
| Database     | PostgreSQL (provisioned via peesequel) |
| Host         | Augustus                               |

---

## Step 1: Register in Service Registry

**File:** `nix-config/modules/service-registry.nix`

Add to `config.constants.services`:

```nix
habitsync = {
  subdomain = "habitsync";
  domain = mkDomain "habitsync";
  url = mkUrl "habitsync";
  clientId = "habitsync";
  port = 6842;
  stateDir = "/var/lib/habitsync";
};
```

---

## Step 2: Create the Service Module

**File:** `nix-config/modules/services/habitsync.nix`

This file defines:

- User/group provisioning
- PostgreSQL database + user + password provisioning (via `peesequel`)
- Kanidm OIDC public client
- OCI container config
- Caddy reverse proxy
- Restic backup

### Key Design Decisions

**OIDC Public Client (PKCE):** HabitSync uses public client settings with PKCE flow. The Kanidm client is configured with `public = true` — no client secret needed. The redirect URI is `${url}/auth-callback` for web and `habitsync://auth-callback` for mobile.

**PostgreSQL:** Uses the existing peesequel provisioning pattern (like Planka) — ensures the database exists, creates the user, and provisions the password from a SOPS secret.

**Database password group:** A shared group (`habitsync-db-pass`) allows both the `habitsync` user and `postgres` user to read the password file, needed for password provisioning.

**JWT Secret:** HabitSync needs a `JWT_SECRET` (SHA-512 hash of a secret key) to persist sessions across restarts. This is stored as a SOPS secret.

---

## Step 3: Secrets (SOPS)

**Secrets to add to `nix-config/secrets/augustus.yaml`:**

| Key                                  | Purpose                                |
| ------------------------------------ | -------------------------------------- |
| `habitsync_db_pass`                  | PostgreSQL password for habitsync user |
| `habitsync_jwt_secret`               | JWT secret for session persistence     |
| `habitsync_restic_backup_passphrase` | Restic backup encryption key           |

Generate values:

```sh
# Database password
openssl rand -base64 32 | tr -d '\n'

# JWT secret (SHA-512 hash of a random key)
openssl rand -base64 64 | tr -d '\n'

# Restic passphrase
openssl rand -base64 32 | tr -d '\n'
```

---

## Step 4: Kanidm Groups & Users

Add to `nix-config/modules/services/kanidm.nix`:

- Groups: `habitsync.access`
- Assign existing users to `habitsync.access` as desired

---

## Step 5: Register Module in Augustus Host

Add `nixos.habitsync` to the modules list in `nix-config/modules/hosts/augustus.nix`.

---

## Environment Variables Summary

| Variable                                   | Value                                                                   | Rationale                                   |
| ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------- |
| `BASE_URL`                                 | `https://habitsync.plato-splunk.media`                                  | Public URL for the service                  |
| `SPRING_DATASOURCE_URL`                    | `jdbc:postgresql://postgres-augustus.plato-splunk.media:5432/habitsync` | PostgreSQL connection via TLS               |
| `SPRING_DATASOURCE_USERNAME`               | `habitsync`                                                             | Database user                               |
| `SPRING_DATASOURCE_PASSWORD`               | _(from SOPS)_                                                           | Database password                           |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME`      | `org.postgresql.Driver`                                                 | PostgreSQL JDBC driver                      |
| `APP_SECURITY_ISSUERS__URL`                | Kanidm OIDC issuer URL                                                  | OIDC provider endpoint                      |
| `APP_SECURITY_ISSUERS__CLIENT-ID`          | `habitsync`                                                             | OIDC client ID                              |
| `APP_SECURITY_ISSUERS__NEEDS-CONFIRMATION` | `false`                                                                 | Auto-approve users authenticated via Kanidm |
| `JWT_SECRET`                               | _(from SOPS)_                                                           | Session persistence across restarts         |
| `PUID`                                     | `6842`                                                                  | Container user ID                           |
| `PGID`                                     | `6842`                                                                  | Container group ID                          |

---

## Checklist

- [ ] Add `habitsync` entry to `service-registry.nix`
- [ ] Create `nix-config/modules/services/habitsync.nix`
- [ ] Add Kanidm group `habitsync.access` to `kanidm.nix`
- [ ] Add users to `habitsync.access` group
- [ ] Add SOPS secrets to `nix-config/secrets/augustus.yaml`
- [ ] Add SOPS declarations to `nix-config/modules/_private/augustus/sops.nix`
- [ ] Add `nixos.habitsync` to `nix-config/modules/hosts/augustus.nix`
- [ ] Create backup directory `/mnt/backups/habitsync` on Augustus
- [ ] Build and deploy NixOS configuration
- [ ] Verify container is running (`podman ps`)
- [ ] Test OIDC login flow via Kanidm
- [ ] Verify restic backup runs successfully

---

## DNS

Ensure `habitsync.plato-splunk.media` resolves to Augustus (likely handled by existing wildcard or Tailscale MagicDNS).

---

## Future Considerations

- **Pin image version**: Once stable, pin to a specific tag.
- **Apprise integration**: Set `APPRISE_API_URL` to point to the Apprise service once it's deployed (`http://127.0.0.1:51571`).
- **Mobile app**: The OIDC redirect `habitsync://auth-callback` is configured for mobile app support.
- **Challenges page**: `PAGE_CHALLENGES_VISIBLE` can be toggled if social features aren't needed.
