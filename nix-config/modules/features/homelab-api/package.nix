{
  self,
  config,
  inputs,
  ...
}:
{
  flake.packages.x86_64-linux.homelab-api =
    let
      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
      pkgs-unstable = inputs.nixpkgs-unstable.legacyPackages.x86_64-linux;
      filter = inputs.nix-filter.lib;
      fetcher = pkgs-unstable.yarn-berry_4-fetcher;

      src = filter {
        root = self;
        include = [
          (filter.matchName "package.json")
          (filter.matchName "yarn.lock")
          (filter.matchName ".yarnrc.yml")
          ".yarn/patches"
          (filter.matchName "tsconfig.base.json")
          (filter.inDirectory "packages")
        ];
        exclude = [
          (filter.matchExt "test.ts")
        ];
      };

      missingHashes = "${self}/missing-hashes.json";

      yarnOfflineCache = fetcher.fetchYarnBerryDeps {
        inherit src missingHashes;
        hash = "sha256-/Nerd3sldR0Ae7nR6VycFGUOhncWB/dmJlWfuYMumhc=";
      };
    in
    pkgs.stdenv.mkDerivation {
      pname = "homelab-api";
      version = "0.1.0";

      inherit src yarnOfflineCache missingHashes;

      nativeBuildInputs = [
        pkgs-unstable.nodejs_26
        pkgs-unstable.yarn-berry
        fetcher.yarnBerryConfigHook
      ];

      YARN_ENABLE_SCRIPTS = "0";

      buildPhase = ''
        runHook preBuild
        yarn workspace homelab-server build
        runHook postBuild
      '';

      installPhase = ''
        runHook preInstall
        mkdir -p $out/lib $out/bin

        cp packages/homelab-server/dist/bundle.js $out/lib/homelab-api.js

        cat > $out/bin/homelab-api <<EOF
        #!/bin/sh
        exec ${pkgs-unstable.nodejs_26}/bin/node $out/lib/homelab-api.js "\$@"
        EOF
        chmod +x $out/bin/homelab-api
        runHook postInstall
      '';
    };
}
