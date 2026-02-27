import { Effect, Layer } from "effect"

import type * as Schemas from "../../schemas/index.js"
import { UuidDictionaryService } from "../uuid-dictionary-service/index.js"
import type { RootPayloadServiceDef } from "./definition.js"
import { RootPayloadService } from "./definition.js"

export const RootPayloadServiceLive = Layer.effect(
  RootPayloadService,
  Effect.gen(function*() {
    return new RootPayloadServiceImpl(
      yield* UuidDictionaryService,
    )
  }),
)

class RootPayloadServiceImpl implements RootPayloadServiceDef {
  constructor(
    private readonly uuids: typeof UuidDictionaryService.Service,
  ) {}

  rootPayload(
    ...additionalPayloads: ReadonlyArray<Schemas.RootPayload.AllPayloads>
  ): Effect.Effect<Schemas.RootPayload.RootPayload> {
    const uuids = this.uuids

    return Effect.succeed(
      {
        ConsentText: { default: "This profile may install certificates and connect to wifi networks." },
        PayloadContent: additionalPayloads,
        PayloadDescription: "This profile installs certificates and configures device to connect to wifi networks.",
        PayloadDisplayName: "Homelab iOS Config",
        PayloadIdentifier: `alford.plato-splunk.homelab.homelab-api.root-payload-service.${uuids.homelabConfigUuid}`,
        PayloadOrganization: "Plato Splunk Media",
        PayloadRemovalDisallowed: false,
        PayloadType: "Configuration",
        PayloadUUID: uuids.homelabConfigUuid,
        PayloadVersion: 1,
      } satisfies Schemas.RootPayload.RootPayload,
    )
  }
}
