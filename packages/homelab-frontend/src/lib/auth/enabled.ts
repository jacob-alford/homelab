export const oidcEnabled: boolean = typeof import.meta.env.PUBLIC_OIDC_CLIENT_ID === "string"
  && import.meta.env.PUBLIC_OIDC_CLIENT_ID.length > 0
  && typeof import.meta.env.PUBLIC_OIDC_WELL_KNOWN_URL === "string"
  && import.meta.env.PUBLIC_OIDC_WELL_KNOWN_URL.length > 0
