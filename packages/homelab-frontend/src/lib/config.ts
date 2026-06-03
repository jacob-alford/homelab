import { Config } from "effect"

export const API_BASE_URL = Config.string("PUBLIC_API_BASE_URL")
export const OIDC_WELL_KNOWN_URL = Config.string("PUBLIC_OIDC_WELL_KNOWN_URL")
export const OIDC_CLIENT_ID = Config.string("PUBLIC_OIDC_CLIENT_ID")
export const UPGRADE_STATUS_URL = Config.string("PUBLIC_UPGRADE_STATUS_URL")
export const UPGRADE_TARGET_ORIGIN = Config.string("PUBLIC_UPGRADE_TARGET_ORIGIN")
