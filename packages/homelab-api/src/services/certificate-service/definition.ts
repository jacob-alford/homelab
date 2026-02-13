import type { PlatformError } from "@effect/platform/Error"
import { Context, Data } from "effect"

export const CertificateServiceConfigId = "AppleMdmXmlPrintingServiceConfig"

export class CertificateServiceConfig extends Context.Tag(CertificateServiceConfigId)<
  CertificateServiceConfig,
  {
    rootCert: string
    intermediateCert: string
  }
>() {}

export const CertificateServiceId = "homelab-api/services/certificate-service/CertificateService"

export class CertificateReadError extends Data.TaggedError("CertificateReadError")<
  {
    readonly error: PlatformError
  }
> {}

export interface CertificateServiceDef {
  readonly rootCert: Buffer
  readonly intermediateCert: Buffer
}

export class CertificateService extends Context.Tag(CertificateServiceId)<CertificateService, CertificateServiceDef>() {
}
