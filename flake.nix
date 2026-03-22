{
  description = "Homelab monorepo with NixOS configurations";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";

    nix-darwin.url = "github:nix-darwin/nix-darwin/nix-darwin-25.11";
    nix-darwin.inputs.nixpkgs.follows = "nixpkgs";

    home-manager.url = "github:nix-community/home-manager/release-25.11";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";

    sops-nix.url = "github:Mic92/sops-nix";
    sops-nix.inputs.nixpkgs.follows = "nixpkgs";

    catppuccin.url = "github:catppuccin/nix/release-25.11";

    nixvim.url = "github:nix-community/nixvim/nixos-25.11";

    affinity-nix.url = "github:mrshmllow/affinity-nix";

    quadlet-nix.url = "github:SEIAROTg/quadlet-nix";

    nix-minecraft.url = "github:Infinidoge/nix-minecraft";

    flake-parts.url = "github:hercules-ci/flake-parts";

    devshell.url = "github:numtide/devshell";

    nix-github-actions.url = "github:nix-community/nix-github-actions";
    nix-github-actions.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs =
    {
      self,
      nixpkgs,
      nixpkgs-unstable,
      catppuccin,
      nixvim,
      home-manager,
      sops-nix,
      nix-darwin,
      affinity-nix,
      quadlet-nix,
      nix-minecraft,
      flake-parts,
      devshell,
      nix-github-actions,
      ...
    }@inputs:
    let
      inherit (self) outputs;
    in
    flake-parts.lib.mkFlake { inherit inputs; } (
      { config, ... }:
      {
        imports = [
          inputs.devshell.flakeModule
        ];

        perSystem =
          { pkgs, ... }:
          let
            dprintPlugins = with pkgs.dprint-plugins; [
              dprint-plugin-typescript
              dprint-plugin-json
              dprint-plugin-markdown
              dprint-plugin-toml
              g-plane-malva
              g-plane-markup_fmt
              g-plane-pretty_yaml
            ];
            pluginArgs = builtins.concatStringsSep " " dprintPlugins;
          in
          {
            formatter = pkgs.dprint;

            checks = {
              formatting =
                pkgs.runCommand "check-formatting"
                  {
                    buildInputs = [ pkgs.dprint ];
                    src = ./.;
                  }
                  ''
                    cd $src
                    ${pkgs.dprint}/bin/dprint check --allow-no-files --plugins ${pluginArgs}
                    touch $out
                  '';

              nix-config =
                pkgs.runCommand "check-nix-config"
                  {
                    buildInputs = [ pkgs.nixos-rebuild ];
                  }
                  ''
                    # Check that NixOS configurations evaluate
                    ${pkgs.nix}/bin/nix eval --no-eval-cache --show-trace \
                      ${self}#nixosConfigurations.nixos.config.system.build.toplevel
                    ${pkgs.nix}/bin/nix eval --no-eval-cache --show-trace \
                      ${self}#nixosConfigurations.augustus.config.system.build.toplevel
                    ${pkgs.nix}/bin/nix eval --no-eval-cache --show-trace \
                      ${self}#nixosConfigurations.cicero.config.system.build.toplevel

                    # Check that home-manager configurations evaluate
                    ${pkgs.nix}/bin/nix eval --no-eval-cache --show-trace \
                      ${self}#homeConfigurations."jacob@nixos".activationPackage
                    ${pkgs.nix}/bin/nix eval --no-eval-cache --show-trace \
                      ${self}#homeConfigurations."jacob@augustus".activationPackage
                    ${pkgs.nix}/bin/nix eval --no-eval-cache --show-trace \
                      ${self}#homeConfigurations."jacob@cicero".activationPackage

                    touch $out
                  '';
            };

            devshells.default = {
            packages = with pkgs; [
              # NixOS tooling
              sops
              age
              # TypeScript/Node development
              dprint
              yarn-berry
              nodejs_24
              typescript
              typescript-language-server
              python3
            ] ++ dprintPlugins;
            env = [
              {
                name = "EDITOR";
                value = "nvim";
              }
            ];
            commands = [
              {
                name = "dprint";
                help = "Format code with dprint using Nix store plugins";
                command = "${pkgs.dprint}/bin/dprint \"$@\" --plugins ${pluginArgs}";
              }
              {
                name = "remote-build-cicero";
                help = "Rebuild Cicero over ssh";
                command = "nixos-rebuild --target-host jacob@cicero.plato-splunk.media switch --flake .#cicero --sudo --ask-sudo-password";
              }
              {
                name = "remote-build-augustus";
                help = "Rebuild Augustus over ssh";
                command = "nixos-rebuild --target-host jacob@augustus.plato-splunk.media switch --flake .#augustus --sudo --ask-sudo-password";
              }
            ];
          };
        };

      systems = [
        "x86_64-linux"
        "aarch64-darwin"
      ];

      flake = {
        githubActions = nix-github-actions.lib.mkGithubMatrix {
          checks.x86_64-linux = config.allSystems.x86_64-linux.checks;
        };

        nixosConfigurations = {
          nixos = nixpkgs.lib.nixosSystem {
            specialArgs = {
              inherit inputs outputs;

              pkgs-unstable = import nixpkgs-unstable {
                system = "x86_64-linux";
                config.allowUnfree = true;
              };
            };

            modules = [
              home-manager.nixosModules.home-manager
              catppuccin.nixosModules.catppuccin
              nixvim.nixosModules.nixvim
              ./nix-config/hosts/nixos
              ./nix-config/shared/services/ssh-cert-renewer.nix
              sops-nix.nixosModules.sops
            ];
          };

          augustus = nixpkgs.lib.nixosSystem {
            specialArgs = {
              inherit inputs outputs;

              pkgs-unstable = import nixpkgs-unstable {
                system = "x86_64-linux";
                config.allowUnfree = true;
              };
            };

            modules = [
              home-manager.nixosModules.home-manager
              ./nix-config/hosts/augustus
              ./nix-config/shared/services/postgres.nix
              ./nix-config/shared/services/ssh-cert-renewer.nix
              sops-nix.nixosModules.sops
              nixvim.nixosModules.nixvim
              quadlet-nix.nixosModules.quadlet
              nix-minecraft.nixosModules.minecraft-servers
              {
                nixpkgs.overlays = [ nix-minecraft.overlay ];
              }
            ];
          };

          cicero = nixpkgs.lib.nixosSystem {
            specialArgs = {
              inherit inputs outputs;

              pkgs-unstable = import nixpkgs-unstable {
                system = "x86_64-linux";
                config.allowUnfree = true;
              };
            };

            modules = [
              home-manager.nixosModules.home-manager
              ./nix-config/hosts/cicero
              ./nix-config/shared/services/ssh-cert-renewer.nix
              sops-nix.nixosModules.sops
              nixvim.nixosModules.nixvim
            ];
          };
        };

        darwinConfigurations = {
          mini = nix-darwin.lib.darwinSystem {
            specialArgs = {
              inherit inputs outputs;
            };

            modules = [
              ./nix-config/hosts/mini
              sops-nix.darwinModules.sops
              nixvim.nixDarwinModules.nixvim
            ];
          };
        };

        homeConfigurations = {
          "jacob@nixos" = home-manager.lib.homeManagerConfiguration {
            pkgs = nixpkgs.legacyPackages.x86_64-linux;
            extraSpecialArgs = {
              inherit inputs outputs;
              pkgs-unstable = import nixpkgs-unstable {
                system = "x86_64-linux";
                config.allowUnfree = true;
              };
            };
            modules = [
              ./nix-config/home/jacob-nixos
            ];
          };

          "jacob@augustus" = home-manager.lib.homeManagerConfiguration {
            pkgs = nixpkgs.legacyPackages.x86_64-linux;
            extraSpecialArgs = {
              inherit inputs outputs;
              pkgs-unstable = nixpkgs-unstable.legacyPackages.x86_64-linux;
            };
            modules = [
              ./nix-config/home/jacob-augustus
            ];
          };

          "jacob@cicero" = home-manager.lib.homeManagerConfiguration {
            pkgs = nixpkgs.legacyPackages.x86_64-linux;
            extraSpecialArgs = {
              inherit inputs outputs;
              pkgs-unstable = nixpkgs-unstable.legacyPackages.x86_64-linux;
            };
            modules = [
              ./nix-config/home/jacob-cicero
            ];
          };
        };
      };
    }
  );
}
