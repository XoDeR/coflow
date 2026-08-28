import { logger, task } from "@trigger.dev/sdk";

/**
 * Minimal design-generation task. Backend wiring only — it accepts the design
 * prompt and target room, echoes the input, and returns it. AI logic, node/edge
 * generation, and canvas writes are added in a later unit.
 */
export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload) => {
    logger.log("Design agent received input", { payload });

    return { received: payload };
  },
});
