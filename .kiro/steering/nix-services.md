# Nix Services & Systemd Patterns

## Failure Notifications

Systemd service failures on **augustus** are reported via the Apprise API to Pushover. Only augustus has failure notifications at present.

### How It Works

1. The `failure-notifs` module (`nix-config/modules/services/failure-notifs.nix`) defines a oneshot systemd service triggered by `OnFailure=`
2. When a monitored service fails, systemd invokes `failure-notifs.service` with `MONITOR_UNIT`, `MONITOR_SERVICE_RESULT`, and `MONITOR_EXIT_STATUS` environment variables
3. The service curls the local Apprise API (`POST /notify/`) targeting the `systemd-failure` tag
4. The Apprise container has a YAML config (sops template in `apprise.nix`) with a `systemd-failure` group that routes to a pushover URL tagged `critical`

### Attaching Services to Failure Notifications

To monitor a new systemd service for failures, add this to the relevant Nix module:

```nix
services.failure-notifs.attachServices = [
  "my-service-name"
];
```

NixOS merges list options by concatenation, so multiple modules can each contribute to `attachServices` independently.

### Where to Place `attachServices`

- **Augustus-only modules** (kanidm, postgres, apprise, habitsync, planka, home-assistant, minecraft, openwebui, radius, it-tools): Place directly in the service module file.
- **Shared modules** (caddy, homelab-api, homelab-secret-provisioner) or host-level services (tailscaled): Place in the private system config (`nix-config/modules/_private/augustus/system.nix`), since other hosts loading the same module don't have the `failure-notifs` option available.

### Current Attached Services

Augustus-only modules contribute:

- `kanidm`, `restic-backups-kanidm`
- `postgresql`, `postgresql-provision-passwords`, `postgresql-update-certs`, `restic-backups-postgres`
- `podman-apprise`, `restic-backups-apprise`
- `podman-habitsync`, `restic-backups-habitsync`
- `podman-planka`, `restic-backups-planka`
- `home-assistant`
- `minecraft-server-vanilla`, `restic-backups-minecraft`
- `open-webui`, `restic-backups-openwebui`
- `podman-radiusd`
- `podman-it-tools`

Private augustus config contributes:

- `caddy`
- `homelab-api`
- `homelab-secret-provisioner`
- `tailscaled`

### Apprise Configuration

The Apprise YAML config is a sops template defined in `apprise.nix`:

- Uses `pushover_user_key` and `pushover_token` secrets from `nix-config/secrets/augustus.yaml`
- Defines a `systemd-failure` group containing the `critical` tag
- The pushover URL is tagged `critical`

This allows future severity levels by adding more URLs with different tags and creating new groups.

### Adding a New Notification Severity

1. Add a new pushover URL (or other service URL) with a distinct tag to the sops template in `apprise.nix`
2. Create a new group in the YAML config mapping a group name to the tag(s)
3. Either reuse the existing `failure-notifs` service with a different `target` override, or create a new oneshot service targeting the new group

## Podman Container Naming

NixOS `virtualisation.oci-containers.containers.<name>` creates a systemd service named `podman-<name>.service`. Use this name when referencing containers in `attachServices` or systemd dependency declarations.

| Container definition   | Systemd service name |
| ---------------------- | -------------------- |
| `containers.apprise`   | `podman-apprise`     |
| `containers.planka`    | `podman-planka`      |
| `containers.habitsync` | `podman-habitsync`   |
| `containers.it-tools`  | `podman-it-tools`    |
| `containers.radiusd`   | `podman-radiusd`     |
