export default {
  "*.{ts,tsx,js,jsx,mjs}": [
    "eslint --fix",
    "yarn test:staged",
  ],
  "*": [
    () => "yarn lint",
    () => "yarn typecheck",
  ],
}
