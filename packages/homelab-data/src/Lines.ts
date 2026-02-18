import type { Monoid as Mn, Semigroup as Sg } from "@effect/typeclass"
import { Array, flow, Iterable } from "effect"

export type Line = readonly [depth: number, line: string]

export function line(...line: Line): Line {
  return line
}

export type Lines = ReadonlyArray<Line>

export const empty: Lines = []

export function lines(...lines: ReadonlyArray<Line>): Lines {
  return lines
}

export function singleton(...line: Line): Lines {
  return [line]
}

export function fstChild(lines: Lines): Line {
  return lines[0]
}

export function isLines(lines: ReadonlyArray<Line>): lines is Lines {
  return lines.length >= 1
}

export const Monoid: Mn.Monoid<Lines> = {
  empty,
  combine(self, that) {
    return self.concat(that) as Lines
  },

  combineMany(self, collection) {
    return self.concat(...collection) as Lines
  },

  combineAll: flow(
    Iterable.flatMap((lines) => lines),
    Array.fromIterable,
  ),
}
