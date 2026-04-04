# NixOS Configuration Reorganization: Dendritic Pattern

## Scope

This is a monorepo. There is a single `flake.nix` and `flake.lock` at the repo root. The Nix configuration lives under `nix-config/`.

- The `flake.nix` already uses `flake-parts`. The `perSystem` block (formatter, checks, devshells), the `systems` list, and the `devshell.flakeModule` import are **not to be modified**.
- Only the `flake` attrset (containing `nixosConfigurations`, `darwinConfigurations`, `homeConfigurations`) should be **removed from `flake.nix`** and replaced by modules auto-imported from `nix-config/modules/`.
- All new and reorganized Nix module files go under `nix-config/modules/`.
- Do not touch files outside `nix-config/` and `./flake.nix`.

## Goal

Reorganize the existing NixOS configuration from a **host-centric** layout into the **Dendritic pattern** — a feature-centric, aspect-oriented layout using `flake-parts` and `import-tree`.

## What is the Dendritic Pattern?

Every `.nix` file under `nix-config/modules/` (except those under `_private/`) is a **flake-parts module**, auto-imported via `import-tree`. Each file defines one or more **aspects** using `flake.modules.<class>.<aspect>`, where:

- `<class>` is a configuration target: `nixos`, `homeManager`, `darwin`, etc.
- `<aspect>` is a feature name like `openssh`, `caddy`, `git`, `desktop-theming`, etc.

Files are named after the **feature they configure**, not the host they apply to. Host-specific wiring (which aspects apply to which host) is handled in dedicated host-declaration modules.

Files or directories prefixed with `_` are ignored by `import-tree` and can be used for private/helper modules.

## Current Structure Summary

```
./flake.nix
./flake.lock
./nix-config/
├── home/                # Home-manager configs, one dir per user@host
│   ├── jacob-augustus/
│   ├── jacob-cicero/
│   └── jacob-nixos/
├── hosts/               # NixOS configs, one dir per host
│   ├── augustus/         # Server: caddy, home-assistant, kanidm, minecraft, etc.
│   ├── cicero/          # Server: openssh, step-ca
│   ├── mini/            # Darwin host
│   └── nixos/           # Desktop: GNOME, NVIDIA, AI, virtualization
├── secrets/             # SOPS secrets per host
└── shared/              # Lightweight shared config
    ├── programs/        # git, nixvim, vscode, zsh (home-manager level)
    └── services/        # postgres, ssh-cert-renewer (nixos level)
```

Hosts: `augustus`, `cicero`, `mini`, `nixos`.
Home configs: `jacob-augustus`, `jacob-cicero`, `jacob-nixos`.

## Target Directory Structure

```
./flake.nix
./flake.lock
./nix-config/
├── modules/
│   ├── services/                  # Network-facing / systemd service aspects (auto-imported)
│   │   ├── caddy.nix
│   │   ├── openssh.nix
│   │   ├── home-assistant.nix
│   │   ├── postgres.nix
│   │   ├── restic.nix
│   │   ├── step-ca.nix
│   │   ├── kanidm.nix
│   │   ├── minecraft.nix
│   │   ├── radius.nix
│   │   ├── openwebui.nix
│   │   ├── planka.nix
│   │   ├── it-tools.nix
│   │   ├── acme.nix
│   │   ├── podman-quadlet.nix
│   │   └── ssh-cert-renewer.nix
│   │
│   ├── programs/                  # Device-local software aspects (auto-imported)
│   │   ├── git.nix
│   │   ├── zsh.nix
│   │   ├── nixvim.nix
│   │   ├── vscode.nix
│   │   ├── gnome-desktop.nix
│   │   ├── nvidia.nix
│   │   ├── ai.nix
│   │   ├── virtualization.nix
│   │   ├── cifs.nix
│   │   └── desktop-theming.nix
│   │
│   ├── hosts/                     # Host declarations — wire aspects (auto-imported)
│   │   ├── augustus.nix
│   │   ├── cicero.nix
│   │   ├── mini.nix
│   │   └── nixos.nix
│   │
│   ├── home/                      # Home-manager declarations (auto-imported)
│   │   ├── jacob-nixos.nix
│   │   ├── jacob-augustus.nix
│   │   └── jacob-cicero.nix
│   │
│   ├── constants.nix              # Shared constants via flake-parts options
│   ├── nix-settings.nix           # Nix daemon/build settings (from shared/nix.nix)
│   ├── darwin-base.nix            # Darwin base config (from shared/nix-darwin.nix)
│   │
│   └── _private/                  # Per-host configs — NOT auto-imported
│       ├── augustus/
│       │   ├── hardware.nix
│       │   ├── filesystems.nix
│       │   ├── security.nix
│       │   ├── users.nix
│       │   ├── sops.nix
│       │   ├── system.nix
│       │   ├── programs.nix       # Host-specific package list / env config
│       │   └── planka-start.sh
│       ├── cicero/
│       │   ├── hardware.nix
│       │   ├── security.nix
│       │   ├── users.nix
│       │   ├── sops.nix
│       │   ├── system.nix
│       │   └── programs.nix
│       ├── nixos/
│       │   ├── hardware.nix
│       │   ├── filesystems.nix
│       │   ├── security.nix
│       │   ├── users.nix
│       │   ├── sops.nix
│       │   ├── system.nix
│       │   └── programs.nix
│       └── mini/
│           ├── sops.nix
│           ├── programs.nix
│           └── Caddyfile
│
└── secrets/                       # Unchanged
    ├── augustus.yaml
    ├── cicero.yaml
    ├── mini.yaml
    └── nixos.yaml
```

### Directory purpose summary

| Directory           | Auto-imported? | Contains                                                                                                      | Naming convention                                        |
| ------------------- | -------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `modules/services/` | Yes            | Network services, daemons, systemd units                                                                      | Named after the service: `caddy.nix`, `openssh.nix`      |
| `modules/programs/` | Yes            | Device-local software, desktop environments, drivers                                                          | Named after the program/feature: `nvidia.nix`, `git.nix` |
| `modules/hosts/`    | Yes            | Host declarations that wire aspects together                                                                  | Named after the host: `augustus.nix`                     |
| `modules/home/`     | Yes            | Home-manager declarations that wire aspects together                                                          | Named after user-host: `jacob-nixos.nix`                 |
| `modules/_private/` | No             | Per-host identity: hardware, filesystems, security, users, sops, system, host-specific programs, static files | Organized in subdirectories per host                     |
| `modules/` (root)   | Yes            | Cross-cutting base configs: constants, nix-settings, darwin-base                                              | Named after the concern                                  |

### Categorization rules

- **services/**: If it runs as a daemon, listens on a port, or is primarily a hosted service — it goes here. This includes things like `ssh-cert-renewer` (a systemd timer/service) and `acme` (certificate automation service).
- **programs/**: If it's software installed on and consumed by the local device — it goes here. This includes desktop environments (`gnome-desktop`), drivers (`nvidia`), editors (`nixvim`, `vscode`), shells (`zsh`), and mount configurations (`cifs`). Programs that are home-manager level and NixOS level can both live here — the class is determined by the `flake.modules.<class>` they export.
- **_private/<host>/**: If the configuration is inherently tied to a specific machine's identity and will vary drastically between systems — it goes here. This includes: `hardware.nix`, `filesystems.nix`, `security.nix`, `users.nix`, `sops.nix`, `system.nix`, and a per-host `programs.nix` (the host-specific package list and environment settings from the current `hosts/<host>/programs.nix` files).

## Current Inputs

All of these inputs must be preserved:

| Input              | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `nixpkgs`          | `nixos-25.11`                                               |
| `nixpkgs-unstable` | `nixos-unstable` — used for `pkgs-unstable` via specialArgs |
| `nix-darwin`       | `nix-darwin-25.11` — follows nixpkgs                        |
| `home-manager`     | `release-25.11` — follows nixpkgs                           |
| `sops-nix`         | Secrets management — follows nixpkgs                        |
| `catppuccin`       | NixOS theming module (used on `nixos` host)                 |
| `nixvim`           | Neovim config module (used on all hosts)                    |
| `affinity-nix`     | Affinity suite                                              |
| `quadlet-nix`      | Podman quadlet module (used on `augustus`)                  |
| `nix-minecraft`    | Minecraft server module + overlay (used on `augustus`)      |
| `flake-parts`      | Already in use                                              |
| `devshell`         | Already in use for dev shells                               |

Add one new input:

| Input         | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `import-tree` | `github:vic/import-tree` — auto-imports all modules |

## Target flake.nix

```nix
{
  description = &quot;Homelab monorepo with NixOS configurations&quot;;

  inputs = {
    # ... all existing inputs preserved exactly ...

    # New input:
    import-tree.url = &quot;github:vic/import-tree&quot;;
  };

  outputs = { self, nixpkgs, ... }@inputs:
    let inherit (self) outputs;
    in inputs.flake-parts.lib.mkFlake { inherit inputs; } (
      { config, ... }: {
        imports = [
          inputs.devshell.flakeModule
          (inputs.import-tree ./nix-config/modules)
        ];

        perSystem = { pkgs, ... }:
          # --- EVERYTHING IN HERE IS UNCHANGED ---
          # Copy verbatim from current flake.nix: formatter, checks, devshells.default
          ...;

        systems = [ &quot;x86_64-linux&quot; &quot;aarch64-darwin&quot; ];

        # The `flake = { ... }` block is REMOVED.
        # All nixosConfigurations, darwinConfigurations, and homeConfigurations
        # are now defined by auto-imported modules under nix-config/modules/.
      }
    );
}
```

## Key Rules

### 1. Every auto-imported file is a flake-parts module

The filesystem hierarchy is purely organizational. The aspect identity is determined by the `flake.modules.<class>.<aspect>` attribute each file exports. For example:

```nix
# nix-config/modules/services/openssh.nix
# File lives under services/ but the aspect name is just &quot;openssh&quot;
{
  flake.modules.nixos.openssh = { config, lib, ... }: {
    services.openssh = {
      enable = true;
      settings.PermitRootLogin = lib.mkDefault &quot;no&quot;;
    };
  };
}
```

```nix
# nix-config/modules/programs/git.nix
{
  flake.modules.homeManager.git = { config, pkgs, ... }: {
    programs.git = {
      enable = true;
      # ...
    };
  };
}
```

For features that span both NixOS and home-manager, define both classes in the same file:

```nix
# nix-config/modules/programs/zsh.nix
{
  flake.modules.nixos.zsh = { pkgs, ... }: {
    programs.zsh.enable = true;
    environment.shells = [ pkgs.zsh ];
  };

  flake.modules.homeManager.zsh = { ... }: {
    programs.zsh = {
      enable = true;
      # ...
    };
  };
}
```

### 2. _private files are plain NixOS/Darwin/home-manager modules (NOT flake-parts modules)

Files under `_private/` are imported explicitly by host declarations. They are standard NixOS modules, not flake-parts modules:

```nix
# nix-config/modules/_private/augustus/hardware.nix
{ config, lib, modulesPath, ... }:
{
  imports = [ (modulesPath + &quot;/installer/scan/not-detected.nix&quot;) ];
  boot.initrd.availableKernelModules = [ &quot;xhci_pci&quot; &quot;ahci&quot; &quot;nvme&quot; ];
  # ...
}
```

```nix
# nix-config/modules/_private/augustus/programs.nix
{ pkgs, ... }:
{
  environment.systemPackages = with pkgs; [
    # Host-specific packages for augustus
  ];
}
```

### 3. Host declaration modules

Each host file in `modules/hosts/` defines `flake.nixosConfigurations.<hostname>` (or `flake.darwinConfigurations`). It selects which aspects apply, includes flake input modules, and imports the host's `_private/` configs:

```nix
# nix-config/modules/hosts/augustus.nix
{ inputs, config, ... }:
{
  flake.nixosConfigurations.augustus = inputs.nixpkgs.lib.nixosSystem {
    system = &quot;x86_64-linux&quot;;
    specialArgs = {
      inherit inputs;
      inherit (inputs.self) outputs;
      pkgs-unstable = import inputs.nixpkgs-unstable {
        system = &quot;x86_64-linux&quot;;
        config.allowUnfree = true;
      };
    };
    modules = [
      # Flake input modules
      inputs.home-manager.nixosModules.home-manager
      inputs.nixvim.nixosModules.nixvim
      inputs.sops-nix.nixosModules.sops
      inputs.quadlet-nix.nixosModules.quadlet
      inputs.nix-minecraft.nixosModules.minecraft-servers
      { nixpkgs.overlays = [ inputs.nix-minecraft.overlay ]; }

      # Shared aspects — services
      inputs.self.modules.nixos.openssh
      inputs.self.modules.nixos.caddy
      inputs.self.modules.nixos.home-assistant
      inputs.self.modules.nixos.postgres
      inputs.self.modules.nixos.ssh-cert-renewer
      inputs.self.modules.nixos.restic
      inputs.self.modules.nixos.kanidm
      inputs.self.modules.nixos.minecraft
      inputs.self.modules.nixos.acme
      inputs.self.modules.nixos.podman-quadlet
      inputs.self.modules.nixos.radius
      inputs.self.modules.nixos.openwebui
      inputs.self.modules.nixos.planka
      inputs.self.modules.nixos.it-tools

      # Shared aspects — programs / base
      inputs.self.modules.nixos.nix-settings

      # Per-host identity — from _private (explicitly imported)
      ./../_private/augustus/hardware.nix
      ./../_private/augustus/filesystems.nix
      ./../_private/augustus/security.nix
      ./../_private/augustus/users.nix
      ./../_private/augustus/sops.nix
      ./../_private/augustus/system.nix
      ./../_private/augustus/programs.nix

      # Inline overrides
      { networking.hostName = &quot;augustus&quot;; }
    ];
  };
}
```

```nix
# nix-config/modules/hosts/mini.nix
{ inputs, config, ... }:
{
  flake.darwinConfigurations.mini = inputs.nix-darwin.lib.darwinSystem {
    specialArgs = {
      inherit inputs;
      inherit (inputs.self) outputs;
    };
    modules = [
      inputs.sops-nix.darwinModules.sops
      inputs.nixvim.nixDarwinModules.nixvim

      # Shared aspects
      inputs.self.modules.darwin.darwin-base
      inputs.self.modules.darwin.nix-settings

      # Per-host identity
      ./../_private/mini/sops.nix
      ./../_private/mini/programs.nix
    ];
  };
}
```

### 4. Home-manager declaration modules

```nix
# nix-config/modules/home/jacob-augustus.nix
{ inputs, config, ... }:
{
  flake.homeConfigurations.&quot;jacob@augustus&quot; = inputs.home-manager.lib.homeManagerConfiguration {
    pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
    extraSpecialArgs = {
      inherit inputs;
      inherit (inputs.self) outputs;
      pkgs-unstable = inputs.nixpkgs-unstable.legacyPackages.x86_64-linux;
    };
    modules = [
      inputs.self.modules.homeManager.git
      inputs.self.modules.homeManager.zsh
      inputs.self.modules.homeManager.nixvim
      # ... relevant aspects for this user/host
    ];
  };
}
```

### 5. Constants

```nix
# nix-config/modules/constants.nix
{ lib, ... }:
{
  options.constants = lib.mkOption {
    type = lib.types.attrs;
    default = {};
    description = &quot;Shared constants available to all flake-parts modules&quot;;
  };

  config.constants = {
    domain = &quot;plato-splunk.media&quot;;
    hosts = {
      augustus = { ip = &quot;...&quot;; system = &quot;x86_64-linux&quot;; };
      cicero = { ip = &quot;...&quot;; system = &quot;x86_64-linux&quot;; };
      nixos = { system = &quot;x86_64-linux&quot;; };
      mini = { system = &quot;aarch64-darwin&quot;; };
    };
    users = {
      jacob = { name = &quot;jacob&quot;; uid = 1000; };
    };
    secretsDir = ./../../secrets;
  };
}
```

### 6. Preserving specialArgs / pkgs-unstable

These differences must be preserved exactly in host/home declaration modules:

| Host             | `pkgs-unstable`                                                                   | `allowUnfree` |
| ---------------- | --------------------------------------------------------------------------------- | ------------- |
| `nixos`          | `import nixpkgs-unstable { system = "x86_64-linux"; config.allowUnfree = true; }` | yes           |
| `augustus`       | `import nixpkgs-unstable { system = "x86_64-linux"; config.allowUnfree = true; }` | yes           |
| `cicero`         | `import nixpkgs-unstable { system = "x86_64-linux"; config.allowUnfree = true; }` | yes           |
| `jacob@nixos`    | `import nixpkgs-unstable { system = "x86_64-linux"; config.allowUnfree = true; }` | yes           |
| `jacob@augustus` | `nixpkgs-unstable.legacyPackages.x86_64-linux`                                    | no            |
| `jacob@cicero`   | `nixpkgs-unstable.legacyPackages.x86_64-linux`                                    | no            |

### 7. Current host wiring (for reference during migration)

This is the exact current wiring from flake.nix. Every module listed here must have a destination in the new structure:

**nixos** (x86_64-linux, desktop):

- Flake modules: `home-manager.nixosModules.home-manager`, `catppuccin.nixosModules.catppuccin`, `nixvim.nixosModules.nixvim`, `sops-nix.nixosModules.sops`
- Local imports: `./nix-config/hosts/nixos`, `./nix-config/shared/services/ssh-cert-renewer.nix`

**augustus** (x86_64-linux, server):

- Flake modules: `home-manager.nixosModules.home-manager`, `nixvim.nixosModules.nixvim`, `sops-nix.nixosModules.sops`, `quadlet-nix.nixosModules.quadlet`, `nix-minecraft.nixosModules.minecraft-servers`
- Overlays: `nix-minecraft.overlay`
- Local imports: `./nix-config/hosts/augustus`, `./nix-config/shared/services/postgres.nix`, `./nix-config/shared/services/ssh-cert-renewer.nix`

**cicero** (x86_64-linux, server):

- Flake modules: `home-manager.nixosModules.home-manager`, `nixvim.nixosModules.nixvim`, `sops-nix.nixosModules.sops`
- Local imports: `./nix-config/hosts/cicero`, `./nix-config/shared/services/ssh-cert-renewer.nix`

**mini** (aarch64-darwin):

- Flake modules: `sops-nix.darwinModules.sops`, `nixvim.nixDarwinModules.nixvim`
- Local imports: `./nix-config/hosts/mini`

**jacob@nixos**: modules `./nix-config/home/jacob-nixos`
**jacob@augustus**: modules `./nix-config/home/jacob-augustus`
**jacob@cicero**: modules `./nix-config/home/jacob-cicero`

### 8. Feature extraction map

| Current location                                                 | Target location                                         | Category | Class              |
| ---------------------------------------------------------------- | ------------------------------------------------------- | -------- | ------------------ |
| `hosts/*/services/openssh.nix`                                   | `modules/services/openssh.nix`                          | services | `nixos`            |
| `hosts/augustus/services/caddy.nix`                              | `modules/services/caddy.nix`                            | services | `nixos`            |
| `hosts/*/services/postgres.nix` + `shared/services/postgres.nix` | `modules/services/postgres.nix`                         | services | `nixos`            |
| `hosts/*/services/restic.nix`                                    | `modules/services/restic.nix`                           | services | `nixos`            |
| `hosts/*/services/step-ca.nix`                                   | `modules/services/step-ca.nix`                          | services | `nixos`            |
| `hosts/augustus/services/home-assistant.nix`                     | `modules/services/home-assistant.nix`                   | services | `nixos`            |
| `hosts/augustus/services/kanidm.nix`                             | `modules/services/kanidm.nix`                           | services | `nixos`            |
| `hosts/augustus/services/minecraft-servers/`                     | `modules/services/minecraft.nix`                        | services | `nixos`            |
| `hosts/augustus/acme.nix`                                        | `modules/services/acme.nix`                             | services | `nixos`            |
| `hosts/augustus/services/quadlet.nix`                            | `modules/services/podman-quadlet.nix`                   | services | `nixos`            |
| `hosts/augustus/services/radius.nix`                             | `modules/services/radius.nix`                           | services | `nixos`            |
| `hosts/augustus/services/openwebui.nix`                          | `modules/services/openwebui.nix`                        | services | `nixos`            |
| `hosts/augustus/services/planka.nix`                             | `modules/services/planka.nix`                           | services | `nixos`            |
| `hosts/augustus/services/it-tools.nix`                           | `modules/services/it-tools.nix`                         | services | `nixos`            |
| `shared/services/ssh-cert-renewer.nix`                           | `modules/services/ssh-cert-renewer.nix`                 | services | `nixos`            |
| `hosts/nixos/services/gnome.nix`                                 | `modules/programs/gnome-desktop.nix`                    | programs | `nixos`            |
| `hosts/nixos/services/nvidia.nix`                                | `modules/programs/nvidia.nix`                           | programs | `nixos`            |
| `hosts/nixos/services/ai.nix`                                    | `modules/programs/ai.nix`                               | programs | `nixos`            |
| `hosts/nixos/services/virtualization.nix`                        | `modules/programs/virtualization.nix`                   | programs | `nixos`            |
| `hosts/nixos/services/cifs.nix`                                  | `modules/programs/cifs.nix`                             | programs | `nixos`            |
| `shared/programs/git.nix`                                        | `modules/programs/git.nix`                              | programs | `homeManager`      |
| `shared/programs/zsh.nix`                                        | `modules/programs/zsh.nix`                              | programs | `homeManager`      |
| `shared/programs/nixvim.nix`                                     | `modules/programs/nixvim.nix`                           | programs | `homeManager`      |
| `shared/programs/vscode.nix`                                     | `modules/programs/vscode.nix`                           | programs | `homeManager`      |
| `home/jacob-nixos/theming.nix`                                   | `modules/programs/desktop-theming.nix`                  | programs | `homeManager`      |
| `shared/nix.nix`                                                 | `modules/nix-settings.nix`                              | base     | `nixos` + `darwin` |
| `shared/nix-darwin.nix`                                          | `modules/darwin-base.nix`                               | base     | `darwin`           |
| `hosts/*/hardware.nix`                                           | `modules/_private/<host>/hardware.nix`                  | per-host | `nixos`            |
| `hosts/*/filesystems.nix`                                        | `modules/_private/<host>/filesystems.nix`               | per-host | `nixos`            |
| `hosts/*/security.nix`                                           | `modules/_private/<host>/security.nix`                  | per-host | `nixos`            |
| `hosts/*/users.nix`                                              | `modules/_private/<host>/users.nix`                     | per-host | `nixos`            |
| `hosts/*/sops.nix`                                               | `modules/_private/<host>/sops.nix`                      | per-host | `nixos`/`darwin`   |
| `hosts/*/system.nix`                                             | `modules/_private/<host>/system.nix`                    | per-host | `nixos`            |
| `hosts/*/programs.nix`                                           | `modules/_private/<host>/programs.nix`                  | per-host | `nixos`/`darwin`   |
| `home/*/programs.nix`                                            | Merge into relevant aspect files in `modules/programs/` | programs | `homeManager`      |
| `hosts/augustus/services/planka-start.sh`                        | `modules/_private/augustus/planka-start.sh`             | per-host | static file        |
| `hosts/mini/Caddyfile`                                           | `modules/_private/mini/Caddyfile`                       | per-host | static file        |

### 9. Handling host-specific differences within a shared aspect

If multiple hosts use the same service but with different configs, use `lib.mkDefault` for common values and let host declarations or `_private/` modules override:

```nix
# nix-config/modules/services/openssh.nix
{
  flake.modules.nixos.openssh = { config, lib, ... }: {
    services.openssh = {
      enable = true;
      settings.PermitRootLogin = lib.mkDefault &quot;no&quot;;
    };
  };
}
```

### 10. Path references

Because `flake.nix` is at the repo root, the flake source root is `./`. Path literals in modules resolve relative to the file they're in. For secrets, use paths relative to the module file or use `inputs.self + "/nix-config/secrets/augustus.yaml"`. Use constants to centralize if repeated.

### 11. What NOT to do

- Do not create `default.nix` files that manually import other files — import-tree handles auto-importing.
- Do not name aspect modules after hosts (e.g., no `modules/services/augustus-caddy.nix`). Name them after the feature.
- Do not modify the `perSystem` block, `systems` list, `formatter`, `checks`, or `devshells` in `flake.nix`.
- Do not modify files outside `nix-config/` and the nix-relevant sections of `./flake.nix`.
- Do not restructure the `secrets/` directory.
- Do not create a second `flake.nix` inside `nix-config/`.
- Do not remove any flake inputs — they are all in use.
- Do not put per-host identity configs (hardware, filesystems, security, users, sops, system, host-specific programs) into auto-imported aspect modules. These belong in `_private/<host>/`.

### 12. Migration approach

When generating changes:

1. Add `import-tree` to `flake.nix` inputs.
2. Add `(inputs.import-tree ./nix-config/modules)` to the `imports` list in `flake.nix` alongside `inputs.devshell.flakeModule`.
3. Remove the entire `flake = { ... }` block from `flake.nix`.
4. Leave `perSystem`, `systems`, and the `devshell` import untouched.
5. Create `nix-config/modules/constants.nix`.
6. Create service aspects under `nix-config/modules/services/`.
7. Create program aspects under `nix-config/modules/programs/`.
8. Create base config modules at `nix-config/modules/` root (`nix-settings.nix`, `darwin-base.nix`).
9. Move per-host identity configs to `nix-config/modules/_private/<host>/`.
10. Create host declarations in `nix-config/modules/hosts/`.
11. Create home declarations in `nix-config/modules/home/`.
12. Verify that every piece of config from the original tree has a home in the new structure.
13. The entire `nix-config/home/`, `nix-config/hosts/`, and `nix-config/shared/` directories can be deleted after migration.

### 13. Verification: Migration must be a no-op

The migration MUST produce identical system closures. After completing the migration:

**For x86_64-linux hosts** (`nixos`, `augustus`, `cicero`, and all `homeConfigurations`):

- Build `nixosConfigurations.*.config.system.build.toplevel` and `homeConfigurations.*.activationPackage` on both old and new branches.
- The output store paths MUST be identical.

**For aarch64-darwin hosts** (`mini`):

- Cannot be built on x86_64-linux. Instead, compare **derivation paths** using `nix eval .#darwinConfigurations.mini.system.drvPath --raw` on both branches.
- Identical `.drv` paths guarantee identical build outputs.

**If paths differ**, use `nix-diff <old-path> <new-path>` to find the root cause. It works on both store paths and derivation paths.

**The most common cause of divergence is path literals** — when a `.nix` file moves, any relative path reference (`./foo`, `./secrets/bar.yaml`) resolves to a different absolute path and changes the derivation hash. To avoid this:

- Use `inputs.self + "/nix-config/secrets/augustus.yaml"` instead of relative paths when referencing files from the flake source tree.
- For static files in `_private/` (like `planka-start.sh`, `Caddyfile`), use paths relative to the importing file and verify they resolve to the same content.
- For `builtins.readFile` or `builtins.readDir` calls, ensure the target path resolves identically.

## Post-Migration Notes: Adjustments from Original Instructions

This section documents the differences between what the migration instructions prescribed
(written without full knowledge of the repo) and what was actually required during implementation.

### 1. Step-CA is a Cicero-only service; Augustus only provisions for it

The instructions listed `hosts/*/services/step-ca.nix` as a shared service to extract.
In reality, the old `hosts/augustus/services/step-ca.nix` was **not** a step-ca server — it
only provisioned the Kanidm OIDC client (`services.kanidm.provision.systems.oauth2."step-ca"`)
and the PostgreSQL database (`services.peesequel.ensureDatabases = ["ca"]`) that step-ca uses.
The actual step-ca server ran only on Cicero.

**What was done**: The unified `modules/services/step-ca.nix` aspect contains the step-ca
server configuration and is imported only by Cicero. The OIDC client and database provisioning
that Augustus performed were merged into `_private/augustus/programs.nix` alongside the other
host-specific PostgreSQL configuration.

### 2. Host-specific inline services moved to `_private/*/system.nix`

The old `hosts/*/services/default.nix` files contained inline service configuration alongside
their import lists — specifically `services.getty.autologinUser`, `services.tailscale.enable`,
`services.xserver.xkb`, and Tailscale sysctl forwarding rules. These were not standalone
"aspects" and didn't warrant their own feature module.

**What was done**: These inline service configs were absorbed into the corresponding
`_private/<host>/system.nix` files, alongside boot, networking, DNS, and locale settings.

### 3. Augustus git config differs from the shared module

The old `home/jacob-augustus/programs.nix` had an inline `programs.git` configuration with a
different signing key (`~/.ssh/id_ed25519`) than the shared `shared/programs/git.nix` module
(`~/.ssh/id_ed25519_signing`). The old jacob-augustus config also never imported
`shared/programs/git.nix`.

**What was done**: The new `jacob-augustus.nix` home declaration preserves the inline git
config rather than importing `inputs.self.modules.homeManager.git`, correctly maintaining the
distinct signing key. `jacob-cicero.nix` imports the shared `homeManager.git` aspect as it
did before (via `shared/programs/git.nix`).

### 4. VSCode was not used on Augustus or Cicero

The instructions listed `shared/programs/vscode.nix` as a program to extract, which was done.
However, neither `jacob@augustus` nor `jacob@cicero` ever imported VSCode — only `jacob@nixos`
(the desktop) used it. This is correctly reflected in the new home declarations.

### 5. `nixpkgs.config.allowUnfree` and `system.stateVersion` placement

These were in the old `hosts/*/default.nix` root files. Since those files were eliminated
in the migration, these settings moved into `_private/<host>/system.nix`.

### 6. Postgres host-specific config merged with step-ca provisions

The old layout had separate files for PostgreSQL config (`hosts/augustus/services/postgres.nix`)
and step-ca provisioning (`hosts/augustus/services/step-ca.nix`). Since both configure the same
`services.peesequel` and related options, they were merged into a single
`_private/augustus/programs.nix` with the database lists combined
(`ensureDatabases = ["jacob" "ca"]`).

### 7. `specialArgs` preserved for backward compatibility

The dendritic pattern recommends against `specialArgs`, but the migration preserved it to
maintain identical system closures. Host declarations still pass `inputs`, `outputs`, and
`pkgs-unstable` via `specialArgs`. This is a pragmatic compromise documented in the audit
report. A future iteration can replace these with flake-parts level options or let-bindings.

### 8. Constants module required `flake.modules` and `flake.homeConfigurations` option declarations

The `constants.nix` file needed to declare `options.flake.modules` and
`options.flake.homeConfigurations` since these aren't built-in flake-parts options. Without
these declarations, aspect modules couldn't set `flake.modules.<class>.<aspect>` and home
declarations couldn't set `flake.homeConfigurations`.

### 9. `nix-settings.nix` is NixOS-only (not dual-class)

The migration document suggested `nix-settings.nix` would cover both `nixos` and `darwin`
classes. In practice, Darwin nix settings are sufficiently different that they live in
`darwin-base.nix` instead. The `nix-settings.nix` aspect only defines
`flake.modules.nixos.nix-settings`.
