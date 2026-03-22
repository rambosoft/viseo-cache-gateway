import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadConfig, resetEnvironmentInitializationForTests } from "../src/config/env";

describe("config env loading", () => {
  afterEach(() => {
    resetEnvironmentInitializationForTests();
  });

  it("loads PRIMARY_SERVER_URL from a local .env file", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "cache-gateway-env-"));
    const previousCwd = process.cwd();
    const previousPrimaryUrl = process.env.PRIMARY_SERVER_URL;

    try {
      writeFileSync(
        join(tempDir, ".env"),
        ["PRIMARY_SERVER_URL=http://127.0.0.1:4000", "REDIS_URL=redis://127.0.0.1:6379"].join("\n")
      );

      delete process.env.PRIMARY_SERVER_URL;
      process.chdir(tempDir);

      const config = loadConfig(process.env);

      expect(config.primaryServerUrl).toBe("http://127.0.0.1:4000");
    } finally {
      process.chdir(previousCwd);
      if (previousPrimaryUrl === undefined) {
        delete process.env.PRIMARY_SERVER_URL;
      } else {
        process.env.PRIMARY_SERVER_URL = previousPrimaryUrl;
      }
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
