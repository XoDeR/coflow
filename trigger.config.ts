import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_rllnoiliytnmwbhcyzuw",
  runtime: "node",
  logLevel: "log",
  // The maximum a single run may execute before it is timed out. Individual
  // tasks can override this with their own `maxDuration`.
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      randomize: true,
    },
  },
  dirs: ["./trigger"],
});
