import { Context } from "effect"
import type { UUID } from "../uuid-service/index.js"

export const UuidDictionaryServiceId = "homelab-api/services/uuid-dictionary-service/UuidDictionaryService"

export interface UuidDictionaryServiceDef {
  wifiPayloadUUID(ssidName: string): UUID | null

  readonly rootCertPayloadUuid: UUID
  readonly intermediateCertPayloadUuid: UUID
  readonly platoSplunkAcmePayloadUuid: UUID
  readonly homelabConfigUuid: UUID
}

export class UuidDictionaryService extends Context.Tag(UuidDictionaryServiceId)<
  UuidDictionaryService,
  UuidDictionaryServiceDef
>() {}
