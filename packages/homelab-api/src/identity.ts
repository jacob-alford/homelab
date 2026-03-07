import { HashSet } from "effect"
import type { ScopeOrGroup, ScopeOrGroupSet } from "./schemas/scope-groups.js"

const IdentityTag = Symbol.for("homelab-api/identity")

export type IdentityTag = typeof IdentityTag

export enum IdentityType {
  OIDC = "OIDC",
  mTLS = "mTLS",
}

export type Identity = OIDCIdentity | MTLSIdentity

export abstract class IdentityBase {
  abstract readonly [IdentityTag]: IdentityType

  constructor(
    readonly identifier: string,
  ) {}

  [Symbol.toPrimitive](hint: "number" | "string" | "default") {
    if (hint === "string" || hint === "default") {
      return `${this.identifier} (${this[IdentityTag]})`
    }

    throw new TypeError(`Unable to coerce ${this[IdentityTag].toUpperCase()}Identity into a number`)
  }
}

export class OIDCIdentity extends IdentityBase implements Permissions {
  readonly [IdentityTag] = IdentityType.OIDC

  constructor(
    public readonly email: string,
    private readonly groups: ScopeOrGroupSet,
  ) {
    super(email)
  }

  hasPermission(group: ScopeOrGroup) {
    return HashSet.has(this.groups, group)
  }
}

export class MTLSIdentity extends IdentityBase implements Permissions {
  readonly [IdentityTag] = IdentityType.mTLS

  constructor(
    public readonly commonName: string,
    private readonly scopes: ScopeOrGroupSet,
  ) {
    super(commonName)
  }

  hasPermission(role: ScopeOrGroup): boolean {
    return HashSet.has(this.scopes, role)
  }
}

export interface Permissions {
  hasPermission(identifier: ScopeOrGroup): boolean
}
