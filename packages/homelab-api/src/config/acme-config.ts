import { Context } from "effect"

export const AcmeConfigOptionsId = "homelab-api/config/acme-config/AcmeConfigOptions"

export class AcmeConfigOptions extends Context.Tag(AcmeConfigOptionsId)<
  AcmeConfigOptions,
  {
    acmeUrl: string
    hardwareBound: boolean
    keyType: string
    keySize: number
  }
>() {}
