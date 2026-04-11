# Dendritic Pattern Audit Report

Comparison of the homelab NixOS configuration against the
[Dendritic Nix pattern](https://dendrix.oeiuwq.com/Dendritic.html) and
[DocSteve's Dendritic Aspects guide](https://github.com/Doc-Steve/dendritic-design-with-flake-parts/wiki/Dendritic_Aspects).

## Executive Summary

The migration successfully restructured a host-centric NixOS configuration
into a feature-centric dendritic layout. All services and programs are
accounted for with no service disruption risk. The implementation follows
the core tenets of the dendritic pattern with a few pragmatic deviations
documented below.

---

## Host Import Parity

### Augustus (NixOS server)

| Module                                                         | Old Config                                    | New Config                                     | Status |
| -------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------- | ------ |
| home-manager.nixosModules                                      | flake.nix                                     | hosts/augustus.nix                             | ✅     |
| sops-nix.nixosModules.sops                                     | flake.nix                                     | hosts/augustus.nix                             | ✅     |
| nixvim.nixosModules.nixvim                                     | flake.nix                                     | hosts/augustus.nix                             | ✅     |
| quadlet-nix.nixosModules.quadlet                               | flake.nix                                     | hosts/augustus.nix                             | ✅     |
| nix-minecraft.nixosModules + overlay                           | flake.nix                                     | hosts/augustus.nix                             | ✅     |
| nix-settings (shared/nix.nix)                                  | hosts/augustus/default.nix                    | modules.nixos.nix-settings                     | ✅     |
| openssh                                                        | hosts/augustus/services/openssh.nix           | modules.nixos.openssh                          | ✅     |
| ssh-cert-renewer                                               | shared/services/ssh-cert-renewer.nix          | modules.nixos.ssh-cert-renewer                 | ✅     |
| caddy                                                          | hosts/augustus/services/caddy.nix             | modules.nixos.caddy                            | ✅     |
| acme                                                           | hosts/augustus/acme.nix                       | modules.nixos.acme                             | ✅     |
| postgres                                                       | hosts/augustus/services/postgres.nix + shared | modules.nixos.postgres + _private/programs.nix | ✅     |
| restic                                                         | hosts/augustus/services/restic.nix            | modules.nixos.restic                           | ✅     |
| kanidm                                                         | hosts/augustus/services/kanidm.nix            | modules.nixos.kanidm                           | ✅     |
| home-assistant                                                 | hosts/augustus/services/home-assistant.nix    | modules.nixos.home-assistant                   | ✅     |
| minecraft                                                      | hosts/augustus/services/minecraft-servers/    | modules.nixos.minecraft                        | ✅     |
| podman-quadlet                                                 | hosts/augustus/services/quadlet.nix           | modules.nixos.podman-quadlet                   | ✅     |
| radius                                                         | hosts/augustus/services/radius.nix            | modules.nixos.radius                           | ✅     |
| openwebui                                                      | hosts/augustus/services/openwebui.nix         | modules.nixos.openwebui                        | ✅     |
| planka                                                         | hosts/augustus/services/planka.nix            | modules.nixos.planka                           | ✅     |
| it-tools                                                       | hosts/augustus/services/it-tools.nix          | modules.nixos.it-tools                         | ✅     |
| step-ca provisions (OIDC + DB)                                 | hosts/augustus/services/step-ca.nix           | _private/augustus/programs.nix (merged)        | ✅     |
| tailscale, getty, xkb                                          | hosts/augustus/services/default.nix           | _private/augustus/system.nix                   | ✅     |
| hardware, filesystems, security, users, sops, system, programs | hosts/augustus/*.nix                          | _private/augustus/*.nix                        | ✅     |

**Result: Full parity. No missing services or programs.**

### Cicero (NixOS CA server)

| Module                                            | Old Config                           | New Config                     | Status |
| ------------------------------------------------- | ------------------------------------ | ------------------------------ | ------ |
| home-manager.nixosModules                         | flake.nix                            | hosts/cicero.nix               | ✅     |
| sops-nix.nixosModules.sops                        | flake.nix                            | hosts/cicero.nix               | ✅     |
| nixvim.nixosModules.nixvim                        | flake.nix                            | hosts/cicero.nix               | ✅     |
| nix-settings                                      | shared/nix.nix                       | modules.nixos.nix-settings     | ✅     |
| openssh                                           | hosts/cicero/services/openssh.nix    | modules.nixos.openssh          | ✅     |
| ssh-cert-renewer                                  | shared/services/ssh-cert-renewer.nix | modules.nixos.ssh-cert-renewer | ✅     |
| step-ca (server)                                  | hosts/cicero/services/step-ca.nix    | modules.nixos.step-ca          | ✅     |
| tailscale, xkb                                    | hosts/cicero/services/default.nix    | _private/cicero/system.nix     | ✅     |
| pcscd + polkit                                    | hosts/cicero/security.nix            | _private/cicero/security.nix   | ✅     |
| hardware, security, users, sops, system, programs | hosts/cicero/*.nix                   | _private/cicero/*.nix          | ✅     |

**Result: Full parity. No missing services or programs.**

### Home Manager: jacob@augustus

| Module                        | Old Config                       | New Config                   | Status |
| ----------------------------- | -------------------------------- | ---------------------------- | ------ |
| catppuccin.homeModules        | home/jacob-augustus/default.nix  | home/jacob-augustus.nix      | ✅     |
| nixvim.homeModules.nixvim     | home/jacob-augustus/default.nix  | home/jacob-augustus.nix      | ✅     |
| shared nixvim config          | shared/programs/nixvim.nix       | homeManager.nixvim           | ✅     |
| shared zsh config             | shared/programs/zsh.nix          | homeManager.zsh              | ✅     |
| git (inline, distinct key)    | home/jacob-augustus/programs.nix | inline in jacob-augustus.nix | ✅     |
| home-manager, starship        | home/jacob-augustus/programs.nix | inline in jacob-augustus.nix | ✅     |
| pkgs: yubikey-manager, httpie | home/jacob-augustus/programs.nix | inline in jacob-augustus.nix | ✅     |

**Notes:**

- Git uses `~/.ssh/id_ed25519` (not `id_ed25519_signing`), correctly kept inline rather than using the shared `homeManager.git` aspect.
- VSCode was never imported for Augustus — correctly omitted.

**Result: Full parity.**

### Home Manager: jacob@cicero

| Module                        | Old Config                     | New Config                 | Status |
| ----------------------------- | ------------------------------ | -------------------------- | ------ |
| catppuccin.homeModules        | home/jacob-cicero/default.nix  | home/jacob-cicero.nix      | ✅     |
| nixvim.homeModules.nixvim     | home/jacob-cicero/default.nix  | home/jacob-cicero.nix      | ✅     |
| shared nixvim config          | shared/programs/nixvim.nix     | homeManager.nixvim         | ✅     |
| shared zsh config             | shared/programs/zsh.nix        | homeManager.zsh            | ✅     |
| shared git config             | shared/programs/git.nix        | homeManager.git            | ✅     |
| home-manager, starship        | home/jacob-cicero/programs.nix | inline in jacob-cicero.nix | ✅     |
| pkgs: yubikey-manager, httpie | home/jacob-cicero/programs.nix | inline in jacob-cicero.nix | ✅     |

**Result: Full parity.**

---

## Dendritic Pattern Compliance

### ✅ Fully Compliant

| Principle                              | Evidence                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Every file is a flake-parts module** | All files under `modules/` (except `_private/`) export `flake.modules.<class>.<aspect>` or `flake.*Configurations`.                                                               |
| **Feature-centric naming**             | Modules named after features (`openssh`, `caddy`, `kanidm`), not hosts.                                                                                                           |
| **No manual file imports**             | `import-tree` auto-loads all files under `modules/`. No `default.nix` import lists.                                                                                               |
| **Minimal flake.nix**                  | `flake.nix` contains only inputs, `import-tree`, `devshell`, and `perSystem`. All configuration logic is in modules.                                                              |
| **Feature closures**                   | Each service module is self-contained: e.g., `kanidm.nix` defines the Kanidm server, Caddy vhosts, ACME certs, user groups, and Restic backups all in one file.                   |
| **Multi-context aspects**              | `zsh.nix` defines both `flake.modules.nixos.zsh` and `flake.modules.homeManager.zsh`. `nixvim.nix` spans `homeManager` and `darwin`.                                              |
| **Incremental features**               | New services can be added as a single file under `services/` — auto-imported, no other files need modification (beyond the host's module list).                                   |
| **Paths as documentation**             | `modules/services/kanidm.nix` → Kanidm config. `modules/programs/nvidia.nix` → NVIDIA config. Intuitive file discovery.                                                           |
| **`_private/` ignored by import-tree** | Host-identity files correctly use the `_` prefix to opt out of auto-import.                                                                                                       |
| **No file organization restrictions**  | Directory hierarchy (`services/`, `programs/`, `hosts/`) is purely organizational. Aspect identity is determined by the `flake.modules` attribute name.                           |
| **Shared values via let-bindings**     | Service modules use `let` bindings to share values across the module (domains, ports, client IDs). The `constants.nix` module provides shared constants at the flake-parts level. |

### ⚠️ Pragmatic Deviations

#### 1. `specialArgs` still used for `inputs` and `pkgs-unstable`

**What the pattern says**: "No need to use `specialArgs` for communicating values. This is considered an anti-pattern in dendritic setups."

**What we do**: Host declarations pass `inputs` and `pkgs-unstable` via `specialArgs`:

```nix
specialArgs = {
  inherit inputs;
  pkgs-unstable = import inputs.nixpkgs-unstable { ... };
};
```

**Why**: `inputs` is needed by `_private/` security and sops modules (`inputs.self + "/certs/..."` and `inputs.self + "/nix-config/secrets/..."`). `pkgs-unstable` is consumed by aspect modules (`caddy.nix`, `vscode.nix`, `ai.nix`).

**Remediation**: `outputs` was fully removed (never used). Unused `pkgs-unstable` and `inputs` declarations were cleaned from all `_private/` module parameter lists. The remaining `specialArgs` are genuinely needed.

#### 2. Host declarations define `flake.nixosConfigurations` directly

**What the pattern suggests**: Hosts are just another feature — define `flake.modules.nixos.<hostname>` and compose them into `flake.nixosConfigurations` via a helper.

**What we do**: Each `modules/hosts/<host>.nix` directly sets `flake.nixosConfigurations.<host> = nixpkgs.lib.nixosSystem { ... }`.

**Why**: This is simpler and keeps the `nixosSystem` call (with `specialArgs`, flake input modules, and the aspect module list) visible in one place. The DocSteve guide shows both approaches.

**Impact**: Low. The current approach works correctly and is readable. A future iteration could use the `inheritance aspect` pattern where a `system-default` aspect is composed into each host.

#### 3. Home configurations are standalone flake outputs

**What the pattern suggests**: Use the `multi-context aspect` pattern — include home-manager config via `home-manager.users.<name>` inside the NixOS host module.

**What we do**: Home configs are separate `flake.homeConfigurations` outputs, managed independently.

**Why**: This matches the old architecture. It allows applying home-manager changes without a full NixOS rebuild (`home-manager switch --flake .#jacob@augustus`).

**Impact**: Low. Both approaches are valid. Standalone home configs provide faster iteration for user-environment changes.

#### 4. Constants not consumed inside NixOS module evaluation

**What the pattern suggests (Constants Aspect)**: Define options at a shared class (e.g., `generic`) and import into each class hierarchy so that NixOS modules can reference `config.systemConstants.*`.

**What we do**: `constants.nix` defines `options.constants` at the flake-parts level. These are accessible in flake-parts modules but not inside the NixOS module evaluation context (i.e., not accessible in `_private/` modules).

**Why**: The constants are primarily used by the flake-parts modules that compose the host configurations. Service aspect modules access their needed values through `let` bindings rather than constants.

**Remediation path**: If constants are needed inside NixOS evaluation, create a `flake.modules.generic.constants` module and import it into each host's module list.

#### 5. `let` bindings for aspect references (style)

**What the pattern shows**:

```nix
modules = with inputs.self.modules.nixos; [ openssh caddy kanidm ... ];
```

**What we do**:

```nix
let nixos = inputs.self.modules.nixos; in
{ modules = [ nixos.openssh nixos.caddy nixos.kanidm ... ]; }
```

**Why**: Nix `with` expressions parse hyphenated names (e.g., `system-base`) as subtraction expressions. Since our aspect names use hyphens, `let` bindings are the correct alternative. This achieves the same reduction in verbosity while remaining safe for all attribute names.

### ❌ Not Implemented (optional patterns from the resources)

| Pattern                                             | Status         | Notes                                                                                                                                                                |
| --------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inheritance Aspect** (`system-base`)              | ✅ Implemented | `services/system-base.nix` composes `nix-settings`, `openssh`, and `ssh-cert-renewer`. All NixOS hosts import `system-base` instead of the three individual modules. |
| **Collector Aspect** (e.g., Syncthing device IDs)   | Not used       | No cross-host service discovery needed currently.                                                                                                                    |
| **Factory Aspect** (parameterized module templates) | Not used       | Services are distinct enough that templates aren't beneficial yet.                                                                                                   |
| **DRY Aspect** (custom module classes)              | Not used       | No repeated attribute-set patterns identified.                                                                                                                       |
| **`vic/flake-file`** (auto-managed flake.nix)       | Not used       | `flake.nix` is manually maintained. Fine for a single-repo setup.                                                                                                    |

---

## Aspect Pattern Usage in Current Modules

| Module                   | Pattern(s) Used                                         | Notes                                                                                                                          |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `services/kanidm.nix`    | **Simple Aspect** + **Feature Closure**                 | Defines server, Caddy vhosts, ACME cert, Restic backup, user groups — all in one file.                                         |
| `services/openwebui.nix` | **Simple Aspect** + **Feature Closure** + **Collector** | OIDC client, env secrets, Caddy vhost, Restic backup, systemd overrides. Also contributes to `kanidm.provision`.               |
| `services/planka.nix`    | **Simple Aspect** + **Feature Closure** + **Collector** | Similar pattern: OIDC, DB provisioning, container, Caddy, Restic. Contributes to `kanidm.provision` and `services.postgresql`. |
| `programs/zsh.nix`       | **Multi-Context Aspect**                                | Defines both `nixos.zsh` (system shell) and `homeManager.zsh` (user config).                                                   |
| `programs/nixvim.nix`    | **Multi-Context Aspect**                                | Defines both `homeManager.nixvim` and `darwin.nixvim`.                                                                         |
| `constants.nix`          | **Constants Aspect**                                    | Flake-parts level shared values.                                                                                               |
| `nix-settings.nix`       | **Simple Aspect**                                       | NixOS-only nix daemon configuration.                                                                                           |
| `darwin-base.nix`        | **Simple Aspect**                                       | Darwin-only base configuration.                                                                                                |

---

## Recommendations

### Completed ✅

1. **~~Audit `specialArgs` usage in `_private/` modules~~**: Done. Removed `outputs` entirely (unused). Cleaned unused `pkgs-unstable`, `inputs` from all `_private/` parameter lists.

2. **~~Create an `inheritance aspect` for shared host configuration~~**: Done. `services/system-base.nix` composes `nix-settings`, `openssh`, and `ssh-cert-renewer`. All NixOS hosts now import `system-base`.

3. **~~Adopt concise aspect references~~**: Done. Host and home declarations use `let nixos = inputs.self.modules.nixos;` bindings instead of verbose `inputs.self.modules.nixos.xxx` repetition. `with` syntax was not viable due to hyphenated attribute names.

### Medium Priority

4. **Move remaining host-specific service config out of `_private/programs.nix`**: The Augustus `_private/programs.nix` contains PostgreSQL, Kanidm, and Restic configuration that conceptually belongs closer to the service aspects. Consider using the **Collector Aspect** pattern.

### ~~Low Priority~~ Not planned

5. **Evaluate `flake-file`** if flake.nix input management becomes a burden.

6. **Consider integrating home-manager via NixOS module** (`home-manager.users.jacob`) if the standalone approach becomes a maintenance burden.
