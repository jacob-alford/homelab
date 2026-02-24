import { describe, expect, it } from "@effect/vitest"
import { compile, line, lines } from "../src/Lines.js"

describe("Lines", () => {
  describe("compile", () => {
    it("should compile empty lines to empty string", () => {
      const result = compile({ indent: "  ", newline: "\n" })([])

      expect(result).toBe("")
    })

    it("should compile single line with no indentation", () => {
      const result = compile({ indent: "  ", newline: "\n" })([line(0, "hello")])

      expect(result).toBe("hello\n")
    })

    it("should compile single line with indentation", () => {
      const result = compile({ indent: "  ", newline: "\n" })([line(2, "hello")])

      expect(result).toBe("    hello\n")
    })

    it("should compile multiple lines with varying indentation", () => {
      const result = compile({ indent: "  ", newline: "\n" })(lines(
        line(0, "root"),
        line(1, "child"),
        line(2, "grandchild"),
        line(1, "child2"),
      ))

      expect(result).toBe("root\n  child\n    grandchild\n  child2\n")
    })

    it("should respect custom indent string", () => {
      const result = compile({ indent: "    ", newline: "\n" })(lines(
        line(0, "level0"),
        line(1, "level1"),
      ))

      expect(result).toBe("level0\n    level1\n")
    })

    it("should respect custom newline string", () => {
      const result = compile({ indent: "  ", newline: "\r\n" })(lines(
        line(0, "line1"),
        line(0, "line2"),
      ))

      expect(result).toBe("line1\r\nline2\r\n")
    })

    it("should handle tab indentation", () => {
      const result = compile({ indent: "\t", newline: "\n" })(lines(
        line(0, "root"),
        line(1, "tab1"),
        line(2, "tab2"),
      ))

      expect(result).toBe("root\n\ttab1\n\t\ttab2\n")
    })

    it("should handle lines with special characters", () => {
      const result = compile({ indent: "  ", newline: "\n" })(lines(
        line(0, "<tag>"),
        line(1, "content & stuff"),
        line(0, "</tag>"),
      ))

      expect(result).toBe("<tag>\n  content & stuff\n</tag>\n")
    })

    it("should handle empty line content", () => {
      const result = compile({ indent: "  ", newline: "\n" })(lines(
        line(0, "before"),
        line(0, ""),
        line(0, "after"),
      ))

      expect(result).toBe("before\n\nafter\n")
    })

    it("should handle deep nesting", () => {
      const result = compile({ indent: " ", newline: "\n" })([line(5, "deep")])

      expect(result).toBe("     deep\n")
    })
  })
})
