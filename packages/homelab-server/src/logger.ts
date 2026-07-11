import { Array, Cause, Config, FiberId, HashMap, Inspectable, Layer, List, Logger } from "effect"
import { match } from "ts-pattern"

export const structureLogMessage = (u: unknown): unknown => {
  switch (typeof u) {
    case "bigint":
    case "function":
    case "symbol": {
      return String(u)
    }
    default: {
      return Inspectable.toJSON(u)
    }
  }
}

function getLoggableMessage(
  line: unknown,
): Record<string, unknown> {
  if (line instanceof Error) return { error: structureLogMessage(line) }
  if (Array.isArray(line) && line.every((err) => err instanceof Error)) {
    if (line.length === 1) {
      return { error: structureLogMessage(line[0]) }
    }

    return structureLogMessage(
      line.reduce(
        (acc, curr, i) => {
          acc[`error_${i}`] = curr

          return acc
        },
        {} as Record<string, unknown>,
      ),
    ) as Record<string, unknown>
  }

  return structureLogMessage({ message: line }) as Record<string, unknown>
}

export const jsonLogger = Logger.make<unknown, unknown>(
  ({ annotations, cause, date, fiberId, logLevel, message, spans }) => {
    const now = date.getTime()
    const annotationsObj: Record<string, unknown> = {}
    const spansObj: Record<string, number> = {}

    if (HashMap.size(annotations) > 0) {
      for (const [k, v] of annotations) {
        annotationsObj[k] = structureLogMessage(v)
      }
    }

    if (List.isCons(spans)) {
      for (const span of spans) {
        spansObj[span.label] = now - span.startTime
      }
    }

    const loggedMessage = getLoggableMessage(message)

    return {
      logLevel: logLevel.label,
      timestamp: date.toISOString(),
      cause: Cause.isEmpty(cause) ? undefined : Cause.pretty(cause, { renderErrorCause: true }),
      annotations: annotationsObj,
      spans: spansObj,
      fiberId: FiberId.threadName(fiberId),
      ...loggedMessage,
    }
  },
)

export const jsonConsoleLogger = jsonLogger.pipe(
  Logger.map(Inspectable.stringifyCircular),
  Logger.withLeveledConsole,
)

export const LoggerLive = Layer.unwrapEffect(
  Config.option(Config.literal("JSON", "pretty")("LOG_STYLE"))
    .pipe(
      Config.map(
        (_) =>
          match(_)
            .with(
              { _tag: "None" },
              { _tag: "Some", value: "JSON" },
              () => Logger.replace(Logger.defaultLogger, jsonConsoleLogger),
            )
            .with(
              { _tag: "Some", value: "pretty" },
              () => Logger.pretty,
            )
            .exhaustive(),
      ),
    ),
)
