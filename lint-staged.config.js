export default {
  "*": [
    "dprint fmt --incremental",
  ],
  "*.{ts,tsx,js,jsx,mjs}": [
    "eslint --fix",
    "yarn test:staged",
  ],
  "*.{ts,tsx}": [
    () => "yarn lint",
    () => "yarn typecheck",
  ],
  "*.nix": [
    () => "nix flake check --no-build",
  ],
}
