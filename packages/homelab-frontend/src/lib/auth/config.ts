import { Config } from "effect"

export const OIDC_CLIENT_ID = Config.string("PUBLIC_OIDC_CLIENT_ID")
export const OIDC_WELL_KNOWN_URL = Config.string("PUBLIC_OIDC_WELL_KNOWN_URL")
export const OIDC_REDIRECT_PATH = "/oauth/callback"
