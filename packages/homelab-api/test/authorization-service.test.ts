import { describe, expect, it } from "@effect/vitest"
import type { ConfigError } from "effect"
import { ConfigProvider, Effect, HashSet, Layer } from "effect"
import type { Schemas } from "../src/index.js"
import { Identity, Operation, Resource, Services } from "../src/index.js"

const createOIDCIdentity = (email: string, groups: Array<Schemas.ScopeGroups.ScopeOrGroup>): Identity.Identity => {
  return new Identity.OIDCIdentity(email, HashSet.fromIterable(groups))
}

const createMTLSIdentity = (commonName: string, scopes: Array<Schemas.ScopeGroups.ScopeOrGroup>): Identity.Identity => {
  return new Identity.MTLSIdentity(commonName, HashSet.fromIterable(scopes))
}

const createFeatureFlagConfig = (flags: Array<Schemas.FeatureFlags.FeatureFlags>) => {
  return Layer.setConfigProvider(
    ConfigProvider.fromMap(
      new Map([["FEATURE_FLAGS", flags.join(",")]]),
    ),
  )
}

const TestLayer = (
  flags: Array<Schemas.FeatureFlags.FeatureFlags>,
): Layer.Layer<
  Services.AuthorizationService.AuthorizationService | Services.FeatureFlagService.FeatureFlagService,
  ConfigError.ConfigError
> =>
  Services.AuthorizationService.AuthorizationServiceLive.pipe(
    Layer.provideMerge(Services.FeatureFlagService.FeatureFlagServiceLive),
    Layer.provideMerge(createFeatureFlagConfig(flags)),
  )

const allResources = Object.values(Resource)
const allOperations = Object.values(Operation)

const operationMethodMap = {
  [Operation.view]: Services.AuthorizationService.canView,
  [Operation.create]: Services.AuthorizationService.canCreate,
  [Operation.modify]: Services.AuthorizationService.canModify,
  [Operation.delete]: Services.AuthorizationService.canDelete,
} as const

const getRandomDifferentResource = <T extends Resource>(current: T): Exclude<Resource, T> => {
  const others = allResources.filter((r): r is Exclude<Resource, T> => r !== current)
  return others[Math.floor(Math.random() * others.length)]
}

const getRandomDifferentOperation = <T extends Operation>(current: T): Exclude<Operation, T> => {
  const others = allOperations.filter((op): op is Exclude<Operation, T> => op !== current)
  return others[Math.floor(Math.random() * others.length)]
}

describe("AuthorizationService", () => {
  describe.for(allResources)("%s", (resource) => {
    describe.for(allOperations)("%s", (operation) => {
      const checkPermission = operationMethodMap[operation]
      const otherResource = getRandomDifferentResource(resource)
      const otherOperation = getRandomDifferentOperation(operation)

      it.effect("should allow OIDC identity with resource permission", () =>
        Effect.gen(function*() {
          const identity = createOIDCIdentity("user@example.com", [resource])
          const result = yield* checkPermission(identity, resource)
          expect(result).toBe(true)
        }).pipe(Effect.provide(TestLayer([`${resource}.enabled`]))))

      it.effect("should allow OIDC identity with resource.operation permission", () =>
        Effect.gen(function*() {
          const identity = createOIDCIdentity("user@example.com", [`${resource}.${operation}`])
          const result = yield* checkPermission(identity, resource)
          expect(result).toBe(true)
        }).pipe(Effect.provide(TestLayer([`${resource}.enabled`]))))

      it.effect("should allow mTLS identity with resource permission", () =>
        Effect.gen(function*() {
          const identity = createMTLSIdentity("client.example.com", [resource])
          const result = yield* checkPermission(identity, resource)
          expect(result).toBe(true)
        }).pipe(Effect.provide(TestLayer([`${resource}.enabled`]))))

      it.effect("should allow mTLS identity with resource.operation permission", () =>
        Effect.gen(function*() {
          const identity = createMTLSIdentity("client.example.com", [`${resource}.${operation}`])
          const result = yield* checkPermission(identity, resource)
          expect(result).toBe(true)
        }).pipe(Effect.provide(TestLayer([`${resource}.enabled`]))))

      it.effect("should deny when OIDC identity lacks permissions", () =>
        Effect.gen(function*() {
          const identity = createOIDCIdentity("user@example.com", [otherResource])
          const result = yield* Effect.flip(checkPermission(identity, resource))
          expect(result._tag).toBe("AuthorizationError")
          expect(result.operation).toBe(operation)
          expect(result.resource).toBe(resource)
          expect(result.message).toBe(`${identity} is not allowed to perform ${operation} on ${resource}`)
        }).pipe(Effect.provide(TestLayer([`${resource}.enabled`]))))

      it.effect("should deny when mTLS identity lacks permissions", () =>
        Effect.gen(function*() {
          const identity = createMTLSIdentity("client.example.com", [otherResource])
          const result = yield* Effect.flip(checkPermission(identity, resource))
          expect(result._tag).toBe("AuthorizationError")
          expect(result.operation).toBe(operation)
          expect(result.resource).toBe(resource)
          expect(result.message).toBe(`${identity} is not allowed to perform ${operation} on ${resource}`)
        }).pipe(Effect.provide(TestLayer([`${resource}.enabled`]))))

      it.effect("should deny when OIDC identity has permission for different resource", () =>
        Effect.gen(function*() {
          const identity = createOIDCIdentity("user@example.com", [`${otherResource}.${operation}`])
          const result = yield* Effect.flip(checkPermission(identity, resource))
          expect(result._tag).toBe("AuthorizationError")
          expect(result.operation).toBe(operation)
          expect(result.resource).toBe(resource)
          expect(result.message).toBe(`${identity} is not allowed to perform ${operation} on ${resource}`)
        }).pipe(Effect.provide(TestLayer(["*"]))))

      it.effect("should deny when OIDC identity has permission for different operation", () =>
        Effect.gen(function*() {
          const otherOperation = getRandomDifferentOperation(operation)
          const identity = createOIDCIdentity("user@example.com", [`${resource}.${otherOperation}`])
          const result = yield* Effect.flip(checkPermission(identity, resource))
          expect(result._tag).toBe("AuthorizationError")
          expect(result.operation).toBe(operation)
          expect(result.resource).toBe(resource)
          expect(result.message).toBe(`${identity} is not allowed to perform ${operation} on ${resource}`)
        }).pipe(Effect.provide(TestLayer(["*"]))))

      it.effect("should deny when feature flag enabled for different operation", () =>
        Effect.gen(function*() {
          const identity = createOIDCIdentity("user@example.com", [resource])
          const result = yield* Effect.flip(checkPermission(identity, resource))
          expect(result._tag).toBe("AuthorizationError")
          expect(result.operation).toBe(operation)
          expect(result.resource).toBe(resource)
          expect(result.message).toBe(`${operation} is not enabled for ${resource}`)
        }).pipe(Effect.provide(TestLayer([`${resource}.${otherOperation}.enabled`]))))

      it.effect("should deny when feature flag enabled for different resource", () =>
        Effect.gen(function*() {
          const identity = createOIDCIdentity("user@example.com", [resource])
          const result = yield* Effect.flip(checkPermission(identity, resource))
          expect(result._tag).toBe("AuthorizationError")
          expect(result.operation).toBe(operation)
          expect(result.resource).toBe(resource)
          expect(result.message).toBe(`${operation} is not enabled for ${resource}`)
        }).pipe(Effect.provide(TestLayer([`${otherResource}.enabled`]))))

      it.effect("should allow when wildcard feature flag is enabled", () =>
        Effect.gen(function*() {
          const identity = createOIDCIdentity("user@example.com", [resource])
          const result = yield* checkPermission(identity, resource)
          expect(result).toBe(true)
        }).pipe(Effect.provide(TestLayer(["*"]))))

      it.effect("should allow when operation-specific feature flag is enabled", () =>
        Effect.gen(function*() {
          const identity = createOIDCIdentity("user@example.com", [resource])
          const result = yield* checkPermission(identity, resource)
          expect(result).toBe(true)
        }).pipe(Effect.provide(TestLayer([`${resource}.${operation}.enabled`]))))
    })
  })

  describe.for(allResources)("feature flag precedence - %s", (resource) => {
    it.effect("should respect wildcard over resource-specific flags", () =>
      Effect.gen(function*() {
        const identity = createOIDCIdentity("user@example.com", [resource])
        const result = yield* Services.AuthorizationService.canView(identity, resource)
        expect(result).toBe(true)
      }).pipe(Effect.provide(TestLayer(["*"]))))

    it.effect("should respect resource-level flag", () =>
      Effect.gen(function*() {
        const identity = createOIDCIdentity("user@example.com", [resource])
        const result = yield* Services.AuthorizationService.canView(identity, resource)
        expect(result).toBe(true)
      }).pipe(Effect.provide(TestLayer([`${resource}.enabled`]))))

    it.effect("should respect operation-level flag", () =>
      Effect.gen(function*() {
        const identity = createOIDCIdentity("user@example.com", [resource])
        const result = yield* Services.AuthorizationService.canView(identity, resource)
        expect(result).toBe(true)
      }).pipe(Effect.provide(TestLayer([`${resource}.view.enabled`]))))
  })

  describe.for(allResources)("permission hierarchy - %s", (resource) => {
    it.effect("should allow resource-level permission for any operation", () =>
      Effect.gen(function*() {
        const identity = createOIDCIdentity("admin@example.com", [resource])
        const viewResult = yield* Services.AuthorizationService.canView(identity, resource)
        const createResult = yield* Services.AuthorizationService.canCreate(identity, resource)
        const modifyResult = yield* Services.AuthorizationService.canModify(identity, resource)
        const deleteResult = yield* Services.AuthorizationService.canDelete(identity, resource)

        expect(viewResult).toBe(true)
        expect(createResult).toBe(true)
        expect(modifyResult).toBe(true)
        expect(deleteResult).toBe(true)
      }).pipe(Effect.provide(TestLayer(["*"]))))

    it.effect("should require operation-specific permission when specified", () =>
      Effect.gen(function*() {
        const identity = createOIDCIdentity("user@example.com", [`${resource}.view`])
        const viewResult = yield* Services.AuthorizationService.canView(identity, resource)
        const createResult = yield* Effect.flip(Services.AuthorizationService.canCreate(identity, resource))

        expect(viewResult).toBe(true)
        expect(createResult._tag).toBe("AuthorizationError")
        expect(createResult.operation).toBe(Operation.create)
        expect(createResult.resource).toBe(resource)
        expect(createResult.message).toBe(`${identity} is not allowed to perform ${Operation.create} on ${resource}`)
      }).pipe(Effect.provide(TestLayer(["*"]))))
  })

  describe.for(allResources)("multiple identities - %s", (resource) => {
    it.effect("should handle multiple OIDC identities with different permissions", () =>
      Effect.gen(function*() {
        const admin = createOIDCIdentity("admin@example.com", [resource])
        const user = createOIDCIdentity("user@example.com", [`${resource}.view`])

        const adminView = yield* Services.AuthorizationService.canView(admin, resource)
        const adminCreate = yield* Services.AuthorizationService.canCreate(admin, resource)
        const userView = yield* Services.AuthorizationService.canView(user, resource)
        const userCreate = yield* Effect.flip(Services.AuthorizationService.canCreate(user, resource))

        expect(adminView).toBe(true)
        expect(adminCreate).toBe(true)
        expect(userView).toBe(true)
        expect(userCreate._tag).toBe("AuthorizationError")
        expect(userCreate.operation).toBe(Operation.create)
        expect(userCreate.resource).toBe(resource)
        expect(userCreate.message).toBe(`${user} is not allowed to perform ${Operation.create} on ${resource}`)
      }).pipe(Effect.provide(TestLayer(["*"]))))

    it.effect("should handle multiple mTLS identities with different permissions", () =>
      Effect.gen(function*() {
        const admin = createMTLSIdentity("admin.example.com", [resource])
        const user = createMTLSIdentity("user.example.com", [`${resource}.view`])

        const adminView = yield* Services.AuthorizationService.canView(admin, resource)
        const adminCreate = yield* Services.AuthorizationService.canCreate(admin, resource)
        const userView = yield* Services.AuthorizationService.canView(user, resource)
        const userCreate = yield* Effect.flip(Services.AuthorizationService.canCreate(user, resource))

        expect(adminView).toBe(true)
        expect(adminCreate).toBe(true)
        expect(userView).toBe(true)
        expect(userCreate._tag).toBe("AuthorizationError")
        expect(userCreate.operation).toBe(Operation.create)
        expect(userCreate.resource).toBe(resource)
        expect(userCreate.message).toBe(`${user} is not allowed to perform ${Operation.create} on ${resource}`)
      }).pipe(Effect.provide(TestLayer(["*"]))))
  })

  describe.for(allResources)("edge cases - %s", (resource) => {
    it.effect("should deny access with empty permissions", () =>
      Effect.gen(function*() {
        const identity = createOIDCIdentity("user@example.com", [])
        const result = yield* Effect.flip(Services.AuthorizationService.canView(identity, resource))
        expect(result._tag).toBe("AuthorizationError")
        expect(result.operation).toBe(Operation.view)
        expect(result.resource).toBe(resource)
        expect(result.message).toBe(`${identity} is not allowed to perform ${Operation.view} on ${resource}`)
      }).pipe(Effect.provide(TestLayer(["*"]))))
  })
})
// test comment
