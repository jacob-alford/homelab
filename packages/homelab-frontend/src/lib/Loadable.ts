import { Either, Option } from "effect"

export type Loadable<A, E = unknown> = Option.Option<Either.Either<A, E>>

export const loading = <A, E = unknown>(): Loadable<A, E> => Option.none()

export const success = <A, E = unknown>(value: A): Loadable<A, E> => Option.some(Either.right(value))

export const failure = <A, E = unknown>(error: E): Loadable<A, E> => Option.some(Either.left(error))

export const isLoading = <A, E>(loadable: Loadable<A, E>): boolean => Option.isNone(loadable)

export const isSuccess = <A, E>(loadable: Loadable<A, E>): loadable is Option.Some<Either.Right<E, A>> =>
  Option.isSome(loadable) && Either.isRight(loadable.value)

export const isFailure = <A, E>(loadable: Loadable<A, E>): loadable is Option.Some<Either.Left<E, A>> =>
  Option.isSome(loadable) && Either.isLeft(loadable.value)

export const getOrNull = <A, E>(loadable: Loadable<A, E>): A | null =>
  Option.isSome(loadable) && Either.isRight(loadable.value) ? loadable.value.right : null

export const getErrorOrNull = <A, E>(loadable: Loadable<A, E>): E | null =>
  Option.isSome(loadable) && Either.isLeft(loadable.value) ? loadable.value.left : null
