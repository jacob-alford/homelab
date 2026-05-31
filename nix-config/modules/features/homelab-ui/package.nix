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
      pname = "homelab-ui";
      version = "0.0.1";

      inherit src yarnOfflineCache missingHashes;

      nativeBuildInputs = [
        pkgs-unstable.nodejs_26
        pkgs-unstable.yarn-berry
        fetcher.yarnBerryConfigHook
      ];

      YARN_ENABLE_SCRIPTS = "0";

      buildPhase = ''
        runHook preBuild
        export PUBLIC_API_BASE_URL="${svc.url}"
        export PUBLIC_OIDC_WELL_KNOWN_URL="${svc.oidcEndpoint}"
        export PUBLIC_OIDC_CLIENT_ID="${svc.clientId}"
        export PUBLIC_IDM_URL="${c.idm.url}"
        yarn workspace homelab-frontend build
        runHook postBuild
      '';

      installPhase = ''
        runHook preInstall
        mkdir -p $out
        cp -r packages/homelab-frontend/dist/* $out/
        runHook postInstall
      '';
    };
}
