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
      filter = inputs.nix-filter.lib;
    in
    pkgs.stdenv.mkDerivation {
      pname = "homelab-api";
      version = "0.1.0";

      src = filter {
        root = self;
        include = [
          (filter.matchName "package.json")
          (filter.matchName "yarn.lock")
          (filter.matchName ".yarnrc.yml")
          (filter.matchName ".pnp.cjs")
          (filter.matchName ".pnp.loader.mjs")
          (filter.inDirectory ".yarn")
          (filter.matchName "tsconfig.base.json")
          (filter.inDirectory "packages")
        ];
        exclude = [
          (filter.matchExt "test.ts")
        ];
      };

      nativeBuildInputs = [
        pkgs.nodejs_24
        pkgs.yarn-berry
      ];

      buildPhase = ''
        export HOME=$TMPDIR
        export YARN_ENABLE_IMMUTABLE_INSTALLS=false
        yarn install --mode=skip-build
        yarn workspace homelab-server build
      '';

      installPhase = ''
        mkdir -p $out/lib $out/bin

        cp packages/homelab-server/dist/bundle.js $out/lib/homelab-api.js

        cat > $out/bin/homelab-api <<EOF
        #!/bin/sh
        exec ${pkgs.nodejs_24}/bin/node $out/lib/homelab-api.js "\$@"
        EOF
        chmod +x $out/bin/homelab-api
      '';
    };
}
