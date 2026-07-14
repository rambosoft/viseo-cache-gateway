const command = process.argv[2] ?? "requested command";

console.error(
  `Cannot run "${command}": application scaffolding is intentionally not configured in this foundation step.`,
);
process.exitCode = 1;
