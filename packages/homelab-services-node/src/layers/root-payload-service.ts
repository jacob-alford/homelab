import { Effect, Layer } from "effect"
import type { Schemas } from "homelab-services"
import { Config, Services } from "homelab-services"

export const RootPayloadServiceLive = Layer.effect(
  Services.RootPayloadService.RootPayloadService,
  Effect.gen(function*() {
    return new RootPayloadServiceImpl(
      yield* Config.ProfileUuidConfig.ProfileUuidConfig,
    )
  }),
)

class RootPayloadServiceImpl implements Services.RootPayloadService.RootPayloadServiceDef {
  constructor(
    private readonly uuids: typeof Config.ProfileUuidConfig.ProfileUuidConfig.Service,
  ) {}

  rootPayload(
    ...args: Parameters<Services.RootPayloadService.RootPayloadServiceDef["rootPayload"]>
  ): Effect.Effect<Schemas.RootPayload.RootPayload> {
    const [payloadId, ...additionalPayloads] = args

    switch (payloadId) {
      case "Wifi": {
        return Effect.succeed(
          {
            ConsentText: { default: "This profile configures Wi-Fi network connections." },
            PayloadContent: additionalPayloads,
            PayloadDescription:
              "This profile installs certificates and configures device to connect to Wi-Fi networks.",
            PayloadDisplayName: "Homelab Wi-Fi Config",
            PayloadIdentifier:
              `alford.plato-splunk.homelab.homelab-api.root-payload-service.${this.uuids.homelabConfigWifiUuid}`,
            PayloadOrganization: "Plato Splunk Media",
            PayloadRemovalDisallowed: false,
            PayloadType: "Configuration",
            PayloadUUID: this.uuids.homelabConfigWifiUuid,
            PayloadVersion: 1,
          } satisfies Schemas.RootPayload.RootPayload,
        )
      }
      case "ACME": {
        return Effect.succeed(
          {
            ConsentText: { default: "This profile configures ACME certificate management." },
            PayloadContent: additionalPayloads,
            PayloadDescription: "This profile configures automatic certificate management via ACME.",
            PayloadDisplayName: "Homelab ACME Config",
            PayloadIdentifier:
              `alford.plato-splunk.homelab.homelab-api.root-payload-service.${this.uuids.homelabConfigAcmeUuid}`,
            PayloadOrganization: "Plato Splunk Media",
            PayloadRemovalDisallowed: false,
            PayloadType: "Configuration",
            PayloadUUID: this.uuids.homelabConfigAcmeUuid,
            PayloadVersion: 1,
          } satisfies Schemas.RootPayload.RootPayload,
        )
      }
      case "Certs": {
        return Effect.succeed(
          {
            ConsentText: { default: "This profile installs trusted CA certificates." },
            PayloadContent: additionalPayloads,
            PayloadDescription: "This profile installs root and intermediate CA certificates for TLS trust.",
            PayloadDisplayName: "Homelab Certificates Config",
            PayloadIdentifier:
              `alford.plato-splunk.homelab.homelab-api.root-payload-service.${this.uuids.homelabConfigCertsUuid}`,
            PayloadOrganization: "Plato Splunk Media",
            PayloadRemovalDisallowed: false,
            PayloadType: "Configuration",
            PayloadUUID: this.uuids.homelabConfigCertsUuid,
            PayloadVersion: 1,
          } satisfies Schemas.RootPayload.RootPayload,
        )
      }
      case "DNS": {
        return Effect.succeed(
          {
            ConsentText: { default: "This profile configures DNS settings." },
            PayloadContent: additionalPayloads,
            PayloadDescription: "This profile configures DNS resolution settings for the device.",
            PayloadDisplayName: "Homelab DNS Config",
            PayloadIdentifier:
              `alford.plato-splunk.homelab.homelab-api.root-payload-service.${this.uuids.homelabConfigDnsUuid}`,
            PayloadOrganization: "Plato Splunk Media",
            PayloadRemovalDisallowed: false,
            PayloadType: "Configuration",
            PayloadUUID: this.uuids.homelabConfigDnsUuid,
            PayloadVersion: 1,
          } satisfies Schemas.RootPayload.RootPayload,
        )
      }
      default: {
        return Effect.die("Unreachable condition")
      }
    }
  }
}
