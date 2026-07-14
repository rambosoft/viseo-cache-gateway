import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rootGeneratedDirectories = [".turbo", "coverage", "playwright-report", "test-results"];
const workspaceRoots = ["apps", "packages"];

await Promise.all(
  rootGeneratedDirectories.map((directory) =>
    rm(resolve(root, directory), { force: true, recursive: true }),
  ),
);

for (const workspaceRoot of workspaceRoots) {
  const entries = await readdir(resolve(root, workspaceRoot), { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) =>
        [".turbo", "dist", "build", "coverage"].map((directory) =>
          rm(resolve(root, workspaceRoot, entry.name, directory), {
            force: true,
            recursive: true,
          }),
        ),
      ),
  );
}

console.log("Removed repository-generated output.");
