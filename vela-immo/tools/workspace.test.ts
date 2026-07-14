import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("workspace foundation", () => {
  it("pins the approved package manager", async () => {
    const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8")) as {
      packageManager?: string;
    };

    expect(packageJson.packageManager).toBe("pnpm@11.13.0");
  });

  it("declares application and shared-package workspace globs", async () => {
    const workspace = await readFile(resolve(root, "pnpm-workspace.yaml"), "utf8");

    expect(workspace).toContain("apps/*");
    expect(workspace).toContain("packages/*");
  });
});
