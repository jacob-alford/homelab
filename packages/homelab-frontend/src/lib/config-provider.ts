import { ConfigProvider } from "effect"

export const AstroConfigProvider = ConfigProvider.fromJson({
  PUBLIC_API_BASE_URL: import.meta.env.PUBLIC_API_BASE_URL ?? "",
  ...(import.meta.env.PUBLIC_OIDC_WELL_KNOWN_URL != null &&
    { PUBLIC_OIDC_WELL_KNOWN_URL: import.meta.env.PUBLIC_OIDC_WELL_KNOWN_URL }),
  ...(import.meta.env.PUBLIC_OIDC_CLIENT_ID != null &&
    { PUBLIC_OIDC_CLIENT_ID: import.meta.env.PUBLIC_OIDC_CLIENT_ID }),
})
