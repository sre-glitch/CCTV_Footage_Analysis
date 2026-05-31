import { copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export default function globalSetup() {
  const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const testDb = resolve(apiRoot, "prisma/test.db");
  const devDb = resolve(apiRoot, "prisma/dev.db");
  if (!existsSync(testDb) && existsSync(devDb)) {
    copyFileSync(devDb, testDb);
  }
}
