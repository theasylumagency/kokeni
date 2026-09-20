import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function writeJsonAtomic(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2) + "\n", "utf8");
    await fs.rename(temporary, file);
  } finally {
    await fs.unlink(temporary).catch(() => undefined);
  }
}

// Exclusive filesystem locks also coordinate separate Next.js workers on one host.
export async function withFileLock<T>(file: string, run: () => Promise<T>, waitMs = 10000): Promise<T> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const deadline = Date.now() + waitMs;
  let handle;
  while (!handle) {
    try { handle = await fs.open(`${file}.lock`, "wx"); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (Date.now() >= deadline) throw new Error("BUSY");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  try { return await run(); }
  finally { await handle.close(); await fs.unlink(`${file}.lock`); }
}
