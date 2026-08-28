import { logger, task, wait } from "@trigger.dev/sdk";

/**
 * Placeholder task that proves the Trigger.dev wiring works end to end.
 * Real background workflows (AI design generation, spec generation) will live
 * alongside this file — see `context/architecture-context.md`.
 */
export const exampleTask = task({
  id: "example",
  maxDuration: 300,
  run: async (payload: { message?: string }, { ctx }) => {
    logger.log("Running example task", { payload, ctx });

    await wait.for({ seconds: 2 });

    return {
      message: `Handled: ${payload.message ?? "hello from Trigger.dev"}`,
    };
  },
});
