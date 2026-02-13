import { Context } from "effect"
import type { UUID } from "../uuid-service/index.js"

export const UuidDictionaryServiceId = "homelab-api/services/uuid-dictionary-service/UuidDictionaryService"

export interface UuidDictionaryServiceDef {
  readonly rootCertPayloadUuid: UUID
  readonly intermediateCertPayloadUuid: UUID
  readonly _0x676179WifiPayloadUuid: UUID
  readonly platoSplunkAcmePayloadUuid: UUID
  readonly _0x676179WifiAndCertsPayloadUuid: UUID
}

export class UuidDictionaryService extends Context.Tag(UuidDictionaryServiceId)<
  UuidDictionaryService,
  UuidDictionaryServiceDef
>() {}
