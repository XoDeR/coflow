import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";

import { generateDesignPlan } from "@/lib/design-actions";
import {
  applyDesignActions,
  clearAiPresence,
  planFocusPosition,
  publishAiActivity,
  readRoomGraph,
  setAiPresence,
} from "@/lib/design-agent-room";

/**
 * Design-generation agent. Interprets a natural-language prompt with Gemini and
 * writes the resulting nodes and edges into the shared Liveblocks room through
 * the same flow storage the editor uses, while publishing the agent's presence
 * and a room-wide status feed so every participant sees the work happen.
 */
export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  // One partial pass is safer than replaying canvas writes; a failed run reports
  // its error to the status feed instead of silently retrying.
  retry: { maxAttempts: 1 },
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const { roomId } = payload;
    const prompt = payload.prompt?.trim() ?? "";
    const runId = ctx.run.id;

    if (!prompt) {
      throw new AbortTaskRunError("A design prompt is required");
    }
    if (!roomId) {
      throw new AbortTaskRunError("A target room is required");
    }

    try {
      await setAiPresence(roomId, { cursor: null, thinking: true });
      await publishAiActivity(roomId, runId, "starting", "Reading the current canvas…");

      const graph = await readRoomGraph(roomId);

      await publishAiActivity(
        roomId,
        runId,
        "thinking",
        "Designing the architecture with Gemini…"
      );
      const plan = await generateDesignPlan({ prompt, graph });
      logger.log("Design plan ready", {
        summary: plan.summary,
        actionCount: plan.actions.length,
      });

      if (plan.actions.length === 0) {
        const message = plan.summary || "No canvas changes were needed for that request.";
        await publishAiActivity(roomId, runId, "complete", message);
        await clearAiPresence(roomId);
        return { summary: plan.summary, applied: 0, skipped: 0 };
      }

      const focus = planFocusPosition(plan.actions);
      await setAiPresence(roomId, { cursor: focus, thinking: true });
      await publishAiActivity(
        roomId,
        runId,
        "updating",
        plan.summary || "Updating the canvas…"
      );

      const result = await applyDesignActions(roomId, plan.actions);
      logger.log("Applied design actions", { ...result });

      const summary = plan.summary || "Updated the canvas.";
      await publishAiActivity(
        roomId,
        runId,
        "complete",
        `${summary} (${result.applied} change${result.applied === 1 ? "" : "s"} applied)`
      );
      await clearAiPresence(roomId);

      return { summary: plan.summary, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Design agent failed", { message });
      // Best-effort: surface the failure to participants and retract presence
      // even if these calls also fail.
      await publishAiActivity(roomId, runId, "error", `Generation failed: ${message}`).catch(
        () => undefined
      );
      await clearAiPresence(roomId).catch(() => undefined);
      throw error;
    }
  },
});
