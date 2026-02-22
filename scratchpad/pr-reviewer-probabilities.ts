import { BunRuntime } from "@effect/platform-bun"
import type { Bounded } from "@effect/typeclass"
import { Console, Effect, pipe } from "effect"

function* positions<V extends string, Slots extends ReadonlyArray<V>>(
  slots_: Slots,
  bounded: Bounded.Bounded<V>,
  cardinality: number,
  succ: (v: V) => V,
  search: (slots: Slots) => boolean,
) {
  const slots = slots_.slice()
  const seen: Set<string> = new Set()

  const toCheck = cardinality ** slots_.length
  let checked = 0

  while (checked <= toCheck) {
    for (let i = Math.floor(Math.random() * slots.length); i < slots.length; ++i) {
      if (!(checked % 1000)) {
        console.log(checked, i, slots, seen)
      }

      ;(slots as any)[i] = succ(slots[i] as any)

      const joined = slots.join("")

      if (seen.has(joined)) {
        continue
      }

      if (search(slots as any)) {
        ++checked
        seen.add(joined)
        yield joined
      }
    }
  }
}

type Rev = "A" | "B" | "C" | "D" | "E"

const BoundedRev: Bounded.Bounded<Rev> = {
  compare() {
    throw new Error("not implemented")
  },
  minBound: "A",
  maxBound: "E",
}

function succ(reviewer: Rev) {
  switch (reviewer) {
    case "A":
      return "B"
    case "B":
      return "C"
    case "C":
      return "D"
    case "D":
      return "E"
    case "E":
      return "A"
  }
}

type PRs = readonly [Rev, Rev, Rev]

function search(prs: PRs): boolean {
  return prs.filter((_) => _ === "B").length === 2
}

const start: PRs = ["A", "A", "A"]

const main = Effect.fn("main")(function*() {
  yield* Effect.forEach(
    positions(
      start,
      BoundedRev,
      5,
      succ,
      search,
    ),
    (_) => Console.log(_),
  )
})

pipe(
  main(),
  BunRuntime.runMain(),
)
