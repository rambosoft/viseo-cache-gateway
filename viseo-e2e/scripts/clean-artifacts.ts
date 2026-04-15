import fs from 'node:fs/promises';
import path from 'node:path';

async function main(): Promise<void> {
  await fs.rm(path.resolve(process.cwd(), 'artifacts'), { recursive: true, force: true });
}

void main();
