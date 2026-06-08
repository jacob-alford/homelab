import { Data, Effect, Option } from "effect"

export class MissingParamError extends Data.TaggedError("MissingParamError")<{
  readonly param: string
}> {
  get message() {
    return `${this.param} is required`
  }
}

export const fromOption = <A>(
  option: Option.Option<A>,
  onNone: () => MissingParamError,
): Effect.Effect<A, MissingParamError> =>
  Option.match(option, {
    onNone: () => Effect.fail(onNone()),
    onSome: Effect.succeed,
  })
