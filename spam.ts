import "dotenv/config";
import fs from "node:fs/promises";
import postmark from "postmark";
import type { Bounce } from "postmark/dist/client/models";

const date = "2026-10-20";

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

async function wasDelivered(bounce: Bounce) {
  const postmarkClient = new postmark.ServerClient(
    process.env.POSTMARK_SERVER_API_TOKEN!,
  );

    const messages = await postmarkClient.getOutboundMessages({
      recipient: bounce.Email,
      fromDate: date,
      toDate: date,
    });

   const otherMessages = messages.Messages.filter(message => message.MessageID !== bounce.MessageID);

   let delivered = false;
   for (const message of otherMessages) {
    const details = await postmarkClient.getOutboundMessageDetails(message.MessageID);
    if (details.MessageEvents.find(event => event.Type === "Delivered")) {
      delivered = true;
      break;
    }
   }

   return delivered;
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

const CHECK_DELIVERED_LATER = true; // rate limit sensitive
async function makeListFromSpamNotifications() {
  const spamNotifs: Bounce[] = JSON.parse(
    await fs.readFile(`spam-notifications-${date}.json`, {
      encoding: "utf-8",
    }),
  );

  let emails: string[] = []
  if (CHECK_DELIVERED_LATER) {
    const undelivered = (await Promise.all(spamNotifs.map(async bounce => {
      if (await wasDelivered(bounce)) return false;
      return bounce;
    }))).filter(bounce => bounce !== false)
    emails = undelivered.map((bounce) => bounce.Email);
  } else {
    emails = spamNotifs.map((bounce) => bounce.Email);
  }

  await fs.writeFile(`spam-resend-${date}.json`, JSON.stringify(emails), {
    encoding: "utf-8",
  });
}

// await fetchSpamNotifications();
await makeListFromSpamNotifications();
