/**
 * One-time script to fix migrated timezone data:
 * 1. Update timezoneId from "Europe/Berlin" to "Europe/Andorra"
 * 2. Recompute timezoneOffset from timezoneId + dateTime (DST-aware)
 * 3. Strip spurious .002 milliseconds from dateTime
 *
 * Run with: npx tsx prisma/scripts/fix-timezone-offsets.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function getTimezoneOffset(ianaId: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaId,
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";

  const match = tzPart.match(/GMT([+-])?(\d+)?(?::(\d+))?/);
  if (!match) return "";

  const sign = match[1] ?? "+";
  const hours = match[2] ?? "0";
  const minutes = match[3] ?? "";

  return minutes
    ? `UTC${sign}${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
    : `UTC${sign}${hours.padStart(2, "0")}`;
}

async function fixTable(
  table: "accountTransaction" | "budgetTransaction",
) {
  const transactions = await (db[table] as typeof db.accountTransaction).findMany({
    select: { id: true, dateTime: true, timezoneId: true },
  });

  let updated = 0;

  for (const tx of transactions) {
    const timezoneId = tx.timezoneId === "Europe/Berlin" ? "Europe/Andorra" : (tx.timezoneId || "");
    const dateTime = new Date(tx.dateTime);
    dateTime.setMilliseconds(0);

    const timezoneOffset = timezoneId ? getTimezoneOffset(timezoneId, dateTime) : "";

    await (db[table] as typeof db.accountTransaction).update({
      where: { id: tx.id },
      data: {
        timezoneId,
        timezoneOffset,
        dateTime,
      },
    });
    updated++;
  }

  console.log(`${table}: updated ${updated} transactions`);
}

async function fixUsers() {
  const users = await db.user.findMany({
    select: { id: true, userTimezone: true },
  });

  let updated = 0;
  for (const user of users) {
    if (user.userTimezone === "Europe/Berlin") {
      await db.user.update({
        where: { id: user.id },
        data: { userTimezone: "Europe/Andorra" },
      });
      updated++;
    }
  }
  console.log(`User: updated ${updated} users`);
}

async function main() {
  console.log("Fixing timezone data...\n");
  await fixTable("accountTransaction");
  await fixTable("budgetTransaction");
  await fixUsers();
  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
