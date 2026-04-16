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

    import-tree.url = "github:vic/import-tree";
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
      import-tree,
      ...
    }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } (
      { config, ... }:
      {
        imports = [
          inputs.devshell.flakeModule
          (inputs.import-tree ./nix-config/modules)
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
            pluginPaths = map (p: "${p}/plugin.wasm") dprintPlugins;
            pluginArgs = builtins.concatStringsSep " " pluginPaths;
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
                    export DPRINT_CACHE_DIR=${"\${DPRINT_CACHE_DIR:-$TMPDIR/dprint-cache}"}
                    ${pkgs.dprint}/bin/dprint check --allow-no-files --plugins ${pluginArgs}
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
                eslint
                yarn-berry
                nodejs_24
                # typescript
                # typescript-language-server
                python3
              ];
              env = [
                {
                  name = "EDITOR";
                  value = "nvim";
                }
                {
                  name = "DPRINT_CACHE_DIR";
                  value = "/home/jacob/.cache/dprint";
                }
              ];
              commands = [
                {
                  name = "fmt";
                  help = "Format code with dprint using Nix store plugins";
                  command = "${pkgs.dprint}/bin/dprint fmt --plugins ${pluginArgs}";
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
      }
    );
}
