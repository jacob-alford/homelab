import { NodeHttpClient } from "@effect/platform-node"
import { Layer } from "effect"
import { DPoPProofBuilderServiceLive } from "homelab-services-node/test-utils"

export const TEST_API_KEY = "test-api-key-1"
export const TEST_LIMITED_API_KEY = "test-limited-api-key-1"

export const E2ETestLayer = Layer.mergeAll(NodeHttpClient.layer, DPoPProofBuilderServiceLive)
