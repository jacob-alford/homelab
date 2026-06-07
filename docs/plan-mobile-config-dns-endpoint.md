# Plan: mobile-config/dns Endpoint

## Overview

Add a new `GET /mobile-config/dns/:profile` endpoint that generates an Apple mobileconfig profile for DNS settings. The `:profile` path parameter selects from four DNS configuration types. Optional query params customize the profile.

---

## Endpoint Parameters

**Path param:**

- `profile` — one of: `private_tailscale`, `monitoring_tailscale`, `private_homelab`, `private_homelab_resolver_only`
  - `private_*` = NextDNS logs disabled
  - `monitoring_tailscale` = NextDNS logs enabled
  - `private_homelab_resolver_only` = no adblocking/tracker blocking, only resolves homelab URLs

**Query params:**

- `name` (optional string) — defaults to authenticated identity's principle
- `ssid` (optional string) — Wi-Fi SSID for on-demand rules; **required** when profile is `private_homelab_resolver_only`

**Validation:** If `profile` is `private_homelab_resolver_only`, the `ssid` query param must be provided (return `BadRequest` otherwise).

All three are passed as arguments to `DnsProfileGeneratorService.dnsProfile(...)`.

**Note:** A single UUID (`homelabConfigDnsUuid`) is used for all DNS profiles since DNS resolution is mutually exclusive — only one profile should be installed at a time.

---

## Profile IDs (NextDNS)

| Profile                         | NextDNS ID |
| ------------------------------- | ---------- |
| `private_tailscale`             | `546af2`   |
| `monitoring_tailscale`          | `cbc883`   |
| `private_homelab`               | `ae8918`   |
| `private_homelab_resolver_only` | `dd66bf`   |

---

## Step 1: Schema Registration

**File:** `packages/homelab-services/src/schemas/index.ts`

- Register existing `config-dns.ts`:
  ```typescript
  export * as DnsConfig from "./config-dns.js"
  ```

**File:** `packages/homelab-services/src/schemas/payload-root.ts`

- Add `DNSConfigSchema` to `AllPayloadsSchema`:
  ```typescript
  import { DNSConfigSchema } from "./config-dns.js"

  export const AllPayloadsSchema = Schema.Union(
    WifiConfigSchema,
    CertificateConfigSchema,
    AcmeConfigSchema,
    DNSConfigSchema,
  )
  ```

---

## Step 2: Service Definitions (`homelab-services`)

### 2a: DNS Config Service

**File:** `packages/homelab-services/src/services/dns-config-service.ts`

Define a service with four methods, each returning `Effect.Effect<Schemas.DnsConfig.DNSConfig>`:

- `tailscalePrivate(name: string, ssid: Option<string>)`
- `tailscaleMonitor(name: string, ssid: Option<string>)`
- `homelabPrivate(name: string, ssid: Option<string>)`
- `homelabPrivateResolverOnly(name: string, ssid: string)` — ssid is required here (validated at handler level)

### 2b: DNS Profile Generator Service

**File:** `packages/homelab-services/src/services/dns-profile-generator.ts`

Single method:

```typescript
dnsProfile(args: {
  profile: "private_tailscale" | "monitoring_tailscale" | "private_homelab" | "private_homelab_resolver_only"
  name: string
  ssid: Option<string>
}): Effect.Effect<Schemas.RootPayload.RootPayloadWire, ApiErrors.HttpApiEncodeError>
```

### 2c: Register in services barrel

**File:** `packages/homelab-services/src/services/index.ts`

```typescript
export * as DnsConfigService from "./dns-config-service.js"
export * as DnsProfileGeneratorService from "./dns-profile-generator.js"
```

---

## Step 3: Service Implementations (`homelab-services-node`)

### 3a: DNS Config Service Layer

**File:** `packages/homelab-services-node/src/layers/dns-config-service.ts`

- Depends on `ProfileUuidConfig`
- Each method builds a `DNSConfig` with Plato Splunk branding
- Common structure for all profiles:
  ```typescript
  {
    DNSSettings: {
      DNSProtocol: "HTTPS",
      ServerURL: new URL(`https://apple.dns.nextdns.io/${profileId}/${name}`),
      ServerAddresses: ["45.90.28.0", "2a07:a8c0::", "45.90.30.0", "2a07:a8c1::"],
    },
    OnDemandRules: [
      {
        Action: "EvaluateConnection",
        ActionParameters: {
          DomainAction: "NeverConnect",
          Domains: [
            "captive.apple.com", "3gppnetwork.org", "dav.orange.fr",
            "vvm.mobistar.be", "vvm.mstore.msg.t-mobile.com",
            "tma.vvm.mone.pan-net.eu", "vvm.ee.co.uk",
          ],
        },
        ...(ssid provided ? { SSIDMatch: [ssid] } : {}),
      },
      {
        Action: "Connect",
        ...(ssid provided ? { SSIDMatch: [ssid] } : {}),
      },
    ],
    ProhibitDisablement: false,
    PayloadType: "com.apple.dnsSettings.managed",
    PayloadIdentifier: `alford.plato-splunk.homelab.dns.${profileId}`,
    PayloadUUID: uuids.homelabConfigDnsUuid,
    PayloadDisplayName: "Homelab DNS Config",
    PayloadDescription: "This profile configures encrypted DNS resolution for the device.",
    PayloadOrganization: "Plato Splunk Media",
    PayloadVersion: 1,
  }
  ```
- When `ssid` is provided, both `EvaluateConnection` and `Connect` rules include `SSIDMatch: [ssid]`
- When `ssid` is not provided, the `SSIDMatch` property is omitted entirely from both rules (not set to undefined)
- No `Disconnect` rules in the array

### 3b: DNS Profile Generator Layer

**File:** `packages/homelab-services-node/src/layers/dns-profile-generator.ts`

- Depends on `DnsConfigService`, `RootPayloadService`
- Selects the appropriate config method based on `args.profile`
- Wraps result with `rootPayloadService.rootPayload("DNS", dnsConfig)`
- Encodes with `Schema.encode(Schemas.RootPayload.RootPayloadSchema)`

### 3c: Wire into Shell Aggregate

**File:** `packages/homelab-services-node/src/shell/profile-payload.ts`

- Add `DnsConfigServiceLive` to `ServiceDeps`
- Add `DnsProfileServiceLive` to the `Aggregate` merge

---

## Step 4: API Endpoint Definition (`homelab-api`)

**File:** `packages/homelab-api/src/homelab/mobile-config/dns.ts`

```typescript
const DnsProfile = HttpApiSchema.param(
  "profile",
  Schema.Literal(
    "private_tailscale",
    "monitoring_tailscale",
    "private_homelab",
    "private_homelab_resolver_only",
  ),
)

const DnsQueryParams = Schema.Struct({
  name: Schema.optional(Schema.String),
  ssid: Schema.optional(Schema.String),
})

export const Dns = HttpApiEndpoint.get("dns")`/dns/${DnsProfile}`
  .addSuccess(Schemas.XML.XMLSchema)
  .addError(ApiErrors.InternalServerError)
  .addError(ApiErrors.BadRequest)
  .addError(ApiErrors.AuthorizationError)
  .addError(HttpApiError.HttpApiDecodeError)
  .setHeaders(Schemas.Token.TokenHeaders)
  .setUrlParams(
    Schemas.Token.AuthQueryParams.pipe(Schema.extend(DnsQueryParams)),
  )
```

**File:** `packages/homelab-api/src/homelab/mobile-config/index.ts`

- Import and `.add(Dns.Dns)` to `MobileConfigApi`
- `export * as Dns from "./dns.js"`

---

## Step 5: Handler Implementation (`homelab-server`)

**File:** `packages/homelab-server/src/handlers/mobile-config/dns.ts`

1. `yield* Middleware.CurrentIdentity`
2. `yield* Services.AuthorizationService.canView(identity, "Config_DNS", args)`
3. **Validate:** if `args.path.profile === "private_homelab_resolver_only"` and `!args.urlParams.ssid`, return `BadRequest`
4. Resolve `name` — use `args.urlParams.name ?? identity.principle`
5. Call `dnsProfileGenerator.dnsProfile({ profile: args.path.profile, name, ssid: Option.fromNullable(args.urlParams.ssid) })`
6. `yield* xmlPrintingService.printXml(...)` to render XML

**File:** `packages/homelab-server/src/handlers/mobile-config/index.ts`

- Add `.handle("dns", handleDns)`

---

## Step 6: Authorization & Identity

Already done:

- [x] `Config_DNS` in `resource-uris.ts`
- [x] `Config_DNS` matcher in `fine-grained-authorization-service.ts`
- [x] `Config_DNS` in authorization test params

**Decision needed:** Should DNS be guest-accessible? If yes, add `"Config_DNS.view"` to `GuestIdentity.permissions`.

---

## Step 7: Unit Test

**File:** `packages/homelab-server/test/handlers/mobile-config/dns.test.ts`

- Test authorization rejection (identity without `Config_DNS` permission)
- Test happy path for each profile type
- Test that `name` defaults to identity principle when not provided
- Test that `private_homelab_resolver_only` without ssid returns `BadRequest`

---

## Step 8: E2E Test

**File:** `packages/homelab-e2e-tests/src/mobile-config/dns.test.ts`

- Test unauthorized request (using `TEST_LIMITED_API_KEY`)
- Test authorized request for each profile type → assert valid XML response
- Test `private_homelab_resolver_only` without ssid → `BadRequest`
- Pattern: same as `certs.test.ts` but with path param in URL

---

## Step 9: Testing Layer Updates

- `packages/homelab-server/test-utils/testing-layer.ts` — add DNS service layers
- `packages/homelab-services-node/test-utils/testing-layer.ts` — if needed

---

## File Checklist

| #  | File                                                        | Action                                       |
| -- | ----------------------------------------------------------- | -------------------------------------------- |
| 1  | `homelab-services/src/schemas/index.ts`                     | Add `DnsConfig` export                       |
| 2  | `homelab-services/src/schemas/payload-root.ts`              | Add `DNSConfigSchema` to `AllPayloadsSchema` |
| 3  | `homelab-services/src/services/dns-config-service.ts`       | Create                                       |
| 4  | `homelab-services/src/services/dns-profile-generator.ts`    | Create                                       |
| 5  | `homelab-services/src/services/index.ts`                    | Add exports                                  |
| 6  | `homelab-services-node/src/layers/dns-config-service.ts`    | Create                                       |
| 7  | `homelab-services-node/src/layers/dns-profile-generator.ts` | Create                                       |
| 8  | `homelab-services-node/src/shell/profile-payload.ts`        | Wire DNS layers                              |
| 9  | `homelab-api/src/homelab/mobile-config/dns.ts`              | Create endpoint def                          |
| 10 | `homelab-api/src/homelab/mobile-config/index.ts`            | Register endpoint                            |
| 11 | `homelab-server/src/handlers/mobile-config/dns.ts`          | Create handler                               |
| 12 | `homelab-server/src/handlers/mobile-config/index.ts`        | Register handler                             |
| 13 | `homelab-services/src/identity.ts`                          | Add guest perms (if applicable)              |
| 14 | `homelab-server/test/handlers/mobile-config/dns.test.ts`    | Create unit test                             |
| 15 | `homelab-e2e-tests/src/mobile-config/dns.test.ts`           | Create e2e test                              |
| 16 | `homelab-server/test-utils/testing-layer.ts`                | Add DNS service layers                       |
| 17 | `homelab-services-node/test-utils/testing-layer.ts`         | Add DNS config (if needed)                   |
