import { Effect, HashMap, Layer, Option } from "effect"
import { ApiErrors, type Identity, Services } from "homelab-services"
import * as Crypto from "node:crypto"

class ClaimCheckServiceImpl implements Services.ClaimCheckService.ClaimCheckServiceDef {
  constructor(
    private claimCheckCache: HashMap.HashMap<string, Identity.Identity> = HashMap.empty(),
  ) {}

  issue(identity: Identity.Identity) {
    return Effect.tryPromise({
      try: async () => {
        const bytes = Crypto.randomBytes(16).toString("hex")

        this.claimCheckCache = HashMap.set(this.claimCheckCache, bytes, identity)

        return bytes
      },
      catch(error) {
        return new ApiErrors.InternalServerError({ error, message: "Failed to issue claim check" })
      },
    })
  }

  validate(claimCheck: string): Effect.Effect<Identity.Identity, ApiErrors.AuthenticationError> {
    return Effect.gen(this, function*() {
      const cacheItem = HashMap.get(this.claimCheckCache, claimCheck)

      return yield* Option.match(cacheItem, {
        onNone() {
          return Effect.fail(
            new ApiErrors.AuthenticationError({
              reason: "invalid-credential",
              message: "Claim check not recognized",
            }),
          )
        },
        onSome(identity) {
          return Effect.succeed(identity)
        },
      })
    })
  }
}

export const ClaimCheckServiceLive = Layer.succeed(
  Services.ClaimCheckService.ClaimCheckService,
  new ClaimCheckServiceImpl(),
)
