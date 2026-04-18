import type { PlatformError } from "@effect/platform/Error"
import { Context, Data } from "effect"

export const CertificateServiceId = "homelab-api/services/certificate-service/CertificateService"

export class CertificateReadError extends Data.TaggedError("CertificateReadError")<
  {
    readonly error: PlatformError
  }
> {}

export interface CertificateServiceDef {
  /** The DER-encoded root CA certificate loaded from disk. */
  readonly rootCert: Buffer

  /** The DER-encoded intermediate CA certificate loaded from disk. */
  readonly intermediateCert: Buffer
}

export class CertificateService extends Context.Tag(CertificateServiceId)<CertificateService, CertificateServiceDef>() {
}
