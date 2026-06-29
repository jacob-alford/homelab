# Ethernet Profile Backend Plan

## Summary

Add an optional `includeEthernetProfile` boolean URL param to the wifi endpoints (wifi and wifi-download). When `true` and the authentication method is PEAP or EAP-TLS, include an 802.1X Global Ethernet payload in the root profile alongside the existing Wi-Fi payload. This reuses the same EAP client configuration between both payloads via a new shared `EapClientConfigService`.

---

## Architecture Overview

```
┌─────────────────────────┐
│  wifi endpoint handler  │
│  (passes new param)     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────┐
│  WifiPayloadService         │
│  (conditionally calls       │
│   EthernetConfigService)    │
└──────────┬──────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌──────────┐  ┌───────────────────────┐
│  WifiCfg │  │  EthernetConfigService │
│  Service │  │  (new)                 │
└────┬─────┘  └───────────┬───────────┘
     │                    │
     └────────┬───────────┘
              ▼
┌──────────────────────────────┐
│  EapClientConfigService      │
│  (new, shared EAP config)    │
└──────────────────────────────┘
```

---

## Step 1: Schema Changes (`homelab-services`)

### `packages/homelab-services/src/schemas/config-wifi.ts`

1. Add a new `EthernetConfigSchema` conformant to Apple's `com.apple.firstactiveethernet.managed` payload type. Properties (from the Apple 802.1X Global Ethernet spec example):
   - `PayloadType`: `"com.apple.firstactiveethernet.managed"`
   - `PayloadIdentifier`: `"com.apple.firstactiveethernet.managed.<uuid>"`
   - `PayloadUUID`: `"1674d657-58d2-4f31-83c4-abe0530f0fef"`
   - `PayloadVersion`: `1`
   - `PayloadDisplayName`: `"Ethernet"`
   - `PayloadDescription`: `"Configures 802.1X Ethernet settings"`
   - `AutoJoin`: `true`
   - `SetupModes`: `["System"]`
   - `AuthenticationMethod`: (empty string per spec)
   - `EAPClientConfiguration`: shared EAP config (same as wifi)
   - Standard `GenericPayloadSchema` fields

2. Create this schema by extending `GenericPayloadSchema` similar to `WifiConfigSchema`.

3. Extract a shared enterprise base schema:
   - Create `WifiMobileConfigParamsEnterpriseBase` extending `WifiMobileConfigParamsBase` with:
     ```typescript
     includeEthernetProfile: Schemas.Optionals.OptionalWithDefault(
       Schema.BooleanFromString,
       () => false,
     )
     ```
   - Update `WifiMobileConfigParamsEnterprisePEAP` to extend `WifiMobileConfigParamsEnterpriseBase` (instead of `WifiMobileConfigParamsBase`)
   - Update `WifiMobileConfigParamsEnterpriseEAPTLS` to extend `WifiMobileConfigParamsEnterpriseBase` (instead of `WifiMobileConfigParamsBase`)

**File:** `packages/homelab-api/src/homelab/mobile-config/wifi.ts`

The `WifiMobileConfigParams` schema union already flows through to the handler args. Since `includeEthernetProfile` is only on the enterprise variants, it will only be accessible after discriminating on `enterpriseClientType`.

**File:** `packages/homelab-api/src/homelab/mobile-config/wifi-download.ts`

No changes needed — it already extends `WifiMobileConfigParams` via `WifiMobileConfigDownloadParams`.

---

## Step 2: New Service — `EapClientConfigService` (`homelab-services`)

**File:** `packages/homelab-services/src/services/eap-client-config-service.ts`

A simple service that returns the `EnterpriseClientConfiguration` object, centralizing EAP config generation.

```typescript
interface EapClientConfigServiceDef {
  peapConfig(
    username: string,
    password: string,
  ): Effect.Effect<Schemas.WifiConfig.PEAPClientConfiguration>

  eapTlsConfig(): Effect.Effect<Schemas.WifiConfig.EAPTLSClientConfiguration>
}
```

Register in `packages/homelab-services/src/services/index.ts`.

---

## Step 3: New Service — `EthernetConfigService` (`homelab-services`)

**File:** `packages/homelab-services/src/services/ethernet-config-service.ts`

```typescript
interface EthernetConfigServiceDef {
  ethernetConfig(
    eapClientConfiguration: Schemas.WifiConfig.EnterpriseClientConfiguration,
  ): Effect.Effect<Schemas.WifiConfig.EthernetConfig>
}
```

This takes the already-built EAP client configuration and wraps it in the Ethernet payload structure. It does NOT have its own payload service — it's called from within `WifiPayloadService`.

Register in `packages/homelab-services/src/services/index.ts`.

---

## Step 4: Update `WifiConfigService` Definition (`homelab-services`)

**File:** `packages/homelab-services/src/services/wifi-config-service.ts`

No interface changes needed. The wifi config service continues to produce `WifiConfig` objects with EAP configs inline. The refactoring is in the implementation only (Step 6).

---

## Step 5: Update `WifiPayloadService` Definition (`homelab-services`)

**File:** `packages/homelab-services/src/services/wifi-profile-generator.ts`

Add `includeEthernetProfile?: boolean` parameter to both enterprise methods:

```typescript
wpa3EnterprisePeapWifi(
  ssid: string,
  username: string,
  password: string,
  disableMACRandomization?: boolean,
  includeEthernetProfile?: boolean,
): Effect.Effect<...>

wpa3EnterpriseEAPTLSWifi(
  ssid: string,
  serialNumber: string,
  disableMACRandomization?: boolean,
  includeEthernetProfile?: boolean,
): Effect.Effect<...>
```

---

## Step 6: Implementations (`homelab-services-node`)

### `packages/homelab-services-node/src/layers/eap-client-config-service.ts` (new)

Implementation pulls `ProfileUuidConfig` for cert anchor UUIDs and returns the `EnterpriseClientConfiguration` structs. Uses the same values currently hardcoded in `wifi-config-service.ts`:

- `PayloadCertificateAnchorUUID`: `[rootCertUuid, intermediateCertUuid]`
- `TLSMaximumVersion`: `"1.3"`
- `TLSMinimumVersion`: `"1.2"`
- `TLSTrustedServerNames`: `["radius.plato-splunk.media"]`

### `packages/homelab-services-node/src/layers/ethernet-config-service.ts` (new)

Implementation wraps the provided `EAPClientConfiguration` with:

- `PayloadType`: `"com.apple.firstactiveethernet.managed"`
- `PayloadUUID`: `"1674d657-58d2-4f31-83c4-abe0530f0fef"`
- `PayloadIdentifier`: `"com.apple.firstactiveethernet.managed.1674d657-58d2-4f31-83c4-abe0530f0fef"`
- `PayloadVersion`: `1`
- `PayloadDisplayName`: `"Ethernet"`
- `PayloadDescription`: `"Configures 802.1X Ethernet settings"`
- `AutoJoin`: `true`
- `SetupModes`: `["System"]`
- `AuthenticationMethod`: `""`
- Other values from the Apple docs example at https://developer.apple.com/documentation/devicemanagement/8021xglobalethernet#Discussion

### `packages/homelab-services-node/src/layers/wifi-config-service.ts` (update)

Refactor `wpa3EnterprisePeapWifi` and `wpa3EnterpriseEAPTLSWifi` to use `EapClientConfigService` instead of building the EAP config inline. The service is injected via constructor.

### `packages/homelab-services-node/src/layers/wifi-profile-generator.ts` (update)

1. Add `EthernetConfigService` and `EapClientConfigService` as constructor dependencies.
2. In `wpa3EnterprisePeapWifi` and `wpa3EnterpriseEAPTLSWifi`:
   - Accept the new `includeEthernetProfile` param.
   - When `true`: call `EapClientConfigService` to get the EAP config, then call `EthernetConfigService.ethernetConfig(eapConfig)` to get the ethernet payload, and include it in `rootPayloadService.rootPayload(...)` alongside the wifi payload.

### `packages/homelab-services-node/src/layers/index.ts` (update)

Add exports for:

- `EapClientConfigServiceLive`
- `EthernetConfigServiceLive`

### `packages/homelab-services-node/src/shell/profile-payload.ts` (update)

Add `EapClientConfigServiceLive` and `EthernetConfigServiceLive` to `ServiceDeps`.

---

## Step 7: Handler Changes (`homelab-server`)

### `packages/homelab-server/src/handlers/mobile-config/wifi.ts`

In the `generateWifiProfile` function, extract `includeEthernetProfile` from the payload when matching on PEAP and EAP-TLS variants (it's only available on those discriminated union branches), and pass it to the service calls:

```typescript
.with(
  { payload: { enterpriseClientType: "EAP-TLS", includeEthernetProfile: P.select("includeEthernetProfile") } },
  ...
  Services.WifiProfileGeneratorService.wpa3EnterpriseEAPTLSWifi(
    ssid, serialNumber, disableMACRandomization, includeEthernetProfile,
  ),
)
.with(
  { payload: { enterpriseClientType: "PEAP", includeEthernetProfile: P.select("includeEthernetProfile") } },
  ...
  Services.WifiProfileGeneratorService.wpa3EnterprisePeapWifi(
    ssid, username, password, disableMACRandomization, includeEthernetProfile,
  ),
)
```

### `packages/homelab-server/src/handlers/mobile-config/wifi-download.ts`

No changes — the download handler already passes through all `urlParams` as payload to `generateWifiProfile`.

---

## Step 8: Unit Tests (`homelab-server/test`)

### `packages/homelab-server/test/handlers/mobile-config/wifi.test.ts`

1. Update `wifiArgs` factory to support `includeEthernetProfile` override.
2. Add tests:
   - **PEAP with ethernet profile**: Assert the XML output contains `com.apple.firstactiveethernet.managed` and the ethernet UUID.
   - **EAP-TLS with ethernet profile**: Same assertion (requires a recognized IP in test setup).
   - **PEAP without ethernet profile**: Assert the XML does NOT contain the ethernet payload type.
   - **Personal wifi**: Assert `includeEthernetProfile` has no effect (param not present on schema).

### Testing layer updates

- `packages/homelab-server/test-utils/testing-layer.ts`: Ensure `EapClientConfigService` and `EthernetConfigService` are provided (either via updated shell aggregate or directly).
- `packages/homelab-services-node/test-utils/testing-layer.ts`: Same.

---

## Step 9: E2E Tests (`homelab-e2e-tests`)

### `packages/homelab-e2e-tests/src/mobile-config/wifi.test.ts`

Add tests for:

- PEAP request with `includeEthernetProfile: true` → response XML contains ethernet payload.
- PEAP request without `includeEthernetProfile` → response XML does NOT contain ethernet payload.

### `packages/homelab-e2e-tests/src/mobile-config/wifi-download.test.ts`

Add test:

- Download with `includeEthernetProfile=true` in query string for PEAP → response includes ethernet payload.

---

## Validation Steps

Run from repo root in order:

```sh
dprint fmt .
yarn lint --fix
yarn lint
yarn typecheck
yarn test
```

If any step fails, target the specific package:

```sh
yarn workspace homelab-services typecheck
yarn workspace homelab-services-node typecheck
yarn workspace homelab-server typecheck
yarn workspace homelab-server test
```

E2E tests (server must be running):

```sh
yarn workspace homelab-e2e-tests test
```

---

## Checklist

- [ ] `EthernetConfigSchema` added to `homelab-services/src/schemas/config-wifi.ts`
- [ ] `WifiMobileConfigParamsEnterpriseBase` extracted with `includeEthernetProfile`
- [ ] PEAP and EAP-TLS params extend new base
- [ ] `EapClientConfigService` defined in `homelab-services/src/services/`
- [ ] `EthernetConfigService` defined in `homelab-services/src/services/`
- [ ] Both registered in `homelab-services/src/services/index.ts`
- [ ] `WifiPayloadService` definition updated with new param
- [ ] `eap-client-config-service.ts` implementation in `homelab-services-node/src/layers/`
- [ ] `ethernet-config-service.ts` implementation in `homelab-services-node/src/layers/`
- [ ] `wifi-config-service.ts` refactored to use `EapClientConfigService`
- [ ] `wifi-profile-generator.ts` updated to conditionally include ethernet payload
- [ ] Both layers registered in `homelab-services-node/src/layers/index.ts`
- [ ] Shell aggregate updated in `homelab-services-node/src/shell/profile-payload.ts`
- [ ] Handler updated to pass `includeEthernetProfile` from discriminated payload
- [ ] Unit tests updated and passing
- [ ] E2E tests updated and passing
- [ ] All validation steps pass
