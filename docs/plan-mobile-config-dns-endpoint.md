# Plan: mobile-config/dns Endpoint

## Status: IMPLEMENTED ✅

All steps completed. Validation passing:

- `dprint fmt` ✅
- `yarn lint` ✅
- `yarn typecheck` ✅
- `yarn test` ✅ (unit tests)
- `yarn workspace homelab-e2e-tests test:e2e` ✅ (135 tests, 14 files)

---

## Overview

Added `GET /mobile-config/dns/:profile` and `GET /mobile-config/dns/:profile/_download` endpoints that generate Apple mobileconfig profiles for DNS settings.

---

## Endpoint Parameters

**Path param:**

- `profile` — one of: `private_tailscale`, `monitoring_tailscale`, `private_homelab`, `private_homelab_resolver_only`

**Query params:**

- `name` (optional string) — defaults to authenticated identity's principle
- `ssid` (optional string) — Wi-Fi SSID for on-demand rules; **required** when profile is `private_homelab_resolver_only`

**Validation:** `private_homelab_resolver_only` without `ssid` returns `BadRequest` (reason: `dns-ssid-required`).

---

## Profile IDs (NextDNS)

| Profile                         | NextDNS ID |
| ------------------------------- | ---------- |
| `private_tailscale`             | `546af2`   |
| `monitoring_tailscale`          | `cbc883`   |
| `private_homelab`               | `ae8918`   |
| `private_homelab_resolver_only` | `dd66bf`   |

---

## Files Changed/Created

| #  | File                                                        | Action                                                     |
| -- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| 1  | `homelab-services/src/schemas/index.ts`                     | Added `DnsConfig` and `DnsProfile` and `Optionals` exports |
| 2  | `homelab-services/src/schemas/payload-root.ts`              | Added `DNSConfigSchema` to `AllPayloadsSchema`             |
| 3  | `homelab-services/src/schemas/dns-profile.ts`               | Created — shared profile literal schema                    |
| 4  | `homelab-services/src/services/dns-config-service.ts`       | Created — service definition                               |
| 5  | `homelab-services/src/services/dns-profile-generator.ts`    | Created — service definition                               |
| 6  | `homelab-services/src/services/index.ts`                    | Added exports                                              |
| 7  | `homelab-services/src/errors/http-errors.ts`                | Added `dns-ssid-required` to BadRequest reasons            |
| 8  | `homelab-services-node/src/layers/dns-config-service.ts`    | Created — implementation                                   |
| 9  | `homelab-services-node/src/layers/dns-profile-generator.ts` | Created — implementation                                   |
| 10 | `homelab-services-node/src/layers/index.ts`                 | Added exports                                              |
| 11 | `homelab-services-node/src/shell/profile-payload.ts`        | Wired DNS layers into aggregate                            |
| 12 | `homelab-api/src/homelab/mobile-config/dns.ts`              | Created — endpoint definition                              |
| 13 | `homelab-api/src/homelab/mobile-config/dns-download.ts`     | Created — download endpoint definition                     |
| 14 | `homelab-api/src/homelab/mobile-config/index.ts`            | Registered both endpoints                                  |
| 15 | `homelab-server/src/handlers/mobile-config/dns.ts`          | Created — handler                                          |
| 16 | `homelab-server/src/handlers/mobile-config/dns-download.ts` | Created — download handler                                 |
| 17 | `homelab-server/src/handlers/mobile-config/index.ts`        | Registered handlers                                        |
| 18 | `homelab-server/test-utils/testing-layer.ts`                | Added DNS service layers                                   |
| 19 | `homelab-server/test/handlers/mobile-config/dns.test.ts`    | Created — unit test                                        |
| 20 | `homelab-e2e-tests/src/mobile-config/dns.test.ts`           | Created — e2e test                                         |
