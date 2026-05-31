{
  self,
  config,
  inputs,
  ...
}:
let
  c = config.constants;
  svc = c.services.homelab;
in
{
  flake.packages.x86_64-linux.homelab-ui =
    let
      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
      filter = inputs.nix-filter.lib;
    in
    pkgs.stdenv.mkDerivation {
      pname = "homelab-ui";
      version = "0.0.1";

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
        export PUBLIC_API_BASE_URL="${svc.url}"
        export PUBLIC_OIDC_WELL_KNOWN_URL="${svc.oidcEndpoint}"
        export PUBLIC_OIDC_CLIENT_ID="${svc.clientId}"
        export PUBLIC_IDM_URL="${c.idm.url}"
        yarn install --mode=skip-build
        yarn workspace homelab-frontend build
      '';

      installPhase = ''
        mkdir -p $out
        cp -r packages/homelab-frontend/dist/* $out/
      '';
    };
}
