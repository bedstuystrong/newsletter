import "dotenv/config";
import fs from "node:fs/promises";
import postmark from "postmark";
import type { Bounce } from "postmark/dist/client/models";

const date = "2026-08-03";

async function fetchSpamNotifications() {
  const postmarkClient = new postmark.ServerClient(
    process.env.POSTMARK_SERVER_API_TOKEN!,
  );

  const bounces = [];
  let totalCount = -1;

  while (bounces.length < totalCount || totalCount < 0) {
    console.log("offset", bounces.length);
    const result = await postmarkClient.getBounces({
      type: postmark.Models.BounceType.SpamNotification,
      count: 500,
      offset: bounces.length,
      fromDate: date,
      toDate: date,
    });

    totalCount = result.TotalCount;
    bounces.push(...result.Bounces);
  }

  console.log(bounces.length);
  await fs.writeFile(
    `spam-notifications-${date}.json`,
    JSON.stringify(bounces),
    {
      encoding: "utf-8",
    },
  );
}

async function analyzeSpamNotifications() {
  const spamNotifs: Bounce[] = JSON.parse(
    await fs.readFile(`spam-notifications-${date}.json`, {
      encoding: "utf-8",
    }),
  );

  console.log(
    spamNotifs.filter(
      (bounce) => !bounce.Details.includes("smtp; 500 4.7.28 Gmail"),
    ),
  );
}

async function makeListFromSpamNotifications() {
  const spamNotifs: Bounce[] = JSON.parse(
    await fs.readFile(`spam-notifications-${date}.json`, {
      encoding: "utf-8",
    }),
  );

  const emails = spamNotifs.map((bounce) => bounce.Email);

  await fs.writeFile(`spam-resend-${date}.json`, JSON.stringify(emails), {
    encoding: "utf-8",
  });
}

await fetchSpamNotifications();
await makeListFromSpamNotifications();
