# GitHub Copilot Instructions for Homelab

## Build & Development Environment

### Command Execution
- **ALWAYS** run commands within a Nix shell using `nix develop`
- **ALWAYS** use yarn workspace syntax when executing workspace commands
- Package names match directory names (e.g., `homelab-api` not `@homelab/homelab-api`)
- Refer to `flake.nix` for available tools and dependencies
- Example: `nix develop --command yarn workspace homelab-api test`

### Verification Commands
- **Typecheck**: `nix develop --command yarn workspace <package-name> typecheck`
- **Lint**: `nix develop --command yarn workspace <package-name> lint`
- **ALWAYS** run typecheck and lint after making code changes to verify correctness

### Available Nix Environment Packages
- yarn-berry
- nodejs_24
- typescript
- typescript-language-server
- python3
- rolldown

## TypeScript Conventions

### Type Definitions
- **Prefer interfaces over type aliases** for object shapes
- Use interfaces for extensibility and clarity
- Reserve type aliases for unions, intersections, and utility types

### Service Architecture

#### Service Definitions
- Implement services with **module-private classes**
- Export only the service's **Layer**, not the class itself
- Pass all required start-time dependencies via **constructor parameters**
- Export **functions** for each service method that return an `Effect` depending on that service

Example pattern:
```typescript
// ServiceName.ts
import { Effect, Layer, Context } from "effect"

interface ServiceName {
  readonly methodName: (params: Params) => Effect.Effect<Result, Error>
}

const ServiceNameTag = Context.GenericTag<ServiceName>("ServiceName")

class ServiceNameImpl implements ServiceName {
  constructor(private readonly dependency: DependencyService) {}
  
  methodName(params: Params): Effect.Effect<Result, Error> {
    // implementation
  }
}

export const ServiceNameLive = Layer.effect(
  ServiceNameTag,
  Effect.map(DependencyServiceTag, (dep) => new ServiceNameImpl(dep))
)

export const methodName = (params: Params) =>
  Effect.flatMap(ServiceNameTag, (service) => service.methodName(params))
```

## Testing Philosophy

### Test Style
- **Prefer integration-style tests** over unit-style tests
- **Minimize mocks** - test with real implementations when feasible
- Focus on testing behavior and contracts, not implementation details

### Effect Testing Utilities
- Use Effect's testing utilities whenever possible
- Leverage **Arbitrary generation** from effect-schemas for property testing
- Use schema-based generators to provide robust, comprehensive test coverage
- Example: Use `Arbitrary(schema)` to generate test data automatically

## Package Structure

### Library vs. Application Packages
- **Library packages**: TypeScript native libraries with **no build commands**
- **Application packages**: Only actively run packages (e.g., `homelab-server`) should have build commands
- Keep the distinction clear between deployable artifacts and reusable libraries

### Build System
- Use **rolldown** for building packages that require bundling
- Configure rolldown for application packages only

## Code Style

### Comments
- **Avoid inline comments** whenever possible
- Rely on the **declarative nature of method names** and other identifiers
- Code should be self-documenting through clear naming
- Only add comments when clarification is genuinely necessary (complex algorithms, non-obvious requirements)

### Naming Conventions
- Choose descriptive, intention-revealing names
- Method names should clearly indicate what they do
- Variable names should clearly indicate what they represent
