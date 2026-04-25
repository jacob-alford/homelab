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
          ./yarn.lock
          (filter.matchExt "ts")
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
        yarn install --immutable
        yarn workspace homelab-server build
      '';

      installPhase = ''
        mkdir -p $out/lib $out/bin

        cp packages/homelab-server/dist/bundle.js $out/lib/homelab-api.js

        cat > $out/bin/homelab-api <<'EOF'
        #!/bin/sh
        exec ${pkgs.nodejs_24}/bin/node $out/lib/homelab-api.js "$@"
        EOF
        chmod +x $out/bin/homelab-api
      '';
    };
}
