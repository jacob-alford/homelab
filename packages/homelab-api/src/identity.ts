import { HashSet } from "effect"

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

export class OIDCIdentity extends IdentityBase implements IdRoleOrGroup {
  readonly [IdentityTag] = IdentityType.OIDC

  constructor(
    public readonly email: string,
    private readonly groups: HashSet.HashSet<string>,
  ) {
    super(email)
  }

  hasRoleOrGroup(_role: string, group: string) {
    return HashSet.has(this.groups, group)
  }
}

export class MTLSIdentity extends IdentityBase implements IdRoleOrGroup {
  readonly [IdentityTag] = IdentityType.mTLS

  constructor(
    public readonly commonName: string,
    private readonly scopes: HashSet.HashSet<string>,
  ) {
    super(commonName)
  }

  hasRoleOrGroup(role: string): boolean {
    return HashSet.has(this.scopes, role)
  }
}

export interface IdRoleOrGroup {
  hasRoleOrGroup(role: string, group: string): boolean
}
