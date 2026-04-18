import { Context } from "effect"
import type { UUID } from "../services/uuid-service.js"

export const ProfileUuidConfigId = "homelab-api/config/profile-uuid-config/ProfileUuidConfig"

export interface ProfileUuidConfigDef {
  /** Looks up the MDM payload UUID for a known Wi-Fi SSID, returning `null` if the SSID is unrecognized. */
  wifiPayloadUUID(ssidName: string): UUID | null

  /** Payload UUID for the root CA certificate MDM entry. */
  readonly rootCertPayloadUuid: UUID

  /** Payload UUID for the intermediate CA certificate MDM entry. */
  readonly intermediateCertPayloadUuid: UUID

  /** Payload UUID for the ACME configuration MDM entry. */
  readonly platoSplunkAcmePayloadUuid: UUID

  /** UUID identifying the top-level homelab configuration profile. */
  readonly homelabConfigUuid: UUID
}

export class ProfileUuidConfig extends Context.Tag(ProfileUuidConfigId)<
  ProfileUuidConfig,
  ProfileUuidConfigDef
>() {}
