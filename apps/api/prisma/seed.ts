import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { eventSchema } from "@store/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const prisma = new PrismaClient();

async function seedPos() {
  const csvPath = resolve(root, "data/pos_transactions.csv");
  if (!existsSync(csvPath)) return;
  const [, ...rows] = readFileSync(csvPath, "utf-8").trim().split(/\r?\n/);
  for (const row of rows) {
    const [store_id, transaction_id, timestamp, basket_value] = row.split(",");
    await prisma.posTransaction.upsert({
      where: { transaction_id },
      update: {},
      create: {
        store_id,
        transaction_id,
        timestamp: new Date(timestamp),
        basket_value: Number(basket_value)
      }
    });
  }
}

async function seedEvents() {
  const candidates = [
    resolve(root, "data/events.jsonl"),
    resolve(root, "work/events.jsonl"),
    resolve(root, "data/sample_events.jsonl")
  ];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) return;

  const events = readFileSync(path, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  let inserted = 0;
  for (const raw of events) {
    const parsed = eventSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn("Skipping invalid event:", parsed.error.message);
      continue;
    }
    const event = parsed.data;
    await prisma.event.upsert({
      where: { event_id: event.event_id },
      update: {},
      create: {
        event_id: event.event_id,
        store_id: event.store_id,
        camera_id: event.camera_id,
        visitor_id: event.visitor_id,
        event_type: event.event_type,
        timestamp: new Date(event.timestamp),
        zone_id: event.zone_id,
        dwell_ms: event.dwell_ms,
        is_staff: event.is_staff,
        confidence: event.confidence,
        metadata: JSON.stringify(event.metadata)
      }
    });
    inserted += 1;
  }
  console.log(`Seeded ${inserted} events from ${path}`);
}

async function main() {
  await seedPos();
  await seedEvents();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
