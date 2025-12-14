import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import "dotenv/config";
import mjml2html from "mjml";
import postmark, { Message } from "postmark";
import { htmlToText } from "html-to-text";
import { confirm } from "@inquirer/prompts";

import { makeOptions } from "./mjml.mts";
import AirtableBase from "./airtable.mts";

const { positionals } = parseArgs({ allowPositionals: true });
const emailName = positionals[0];
if (!emailName) throw new Error("Email name required");

try {
  await fs.access(path.resolve("content", emailName));
} catch (error) {
  throw new Error(`Couldn't find directory content/${emailName}`);
}

const PRODUCTION_URL = "https://newsletter.bedstuystrong.com";

const mjmlPath = path.resolve("content", `${emailName}/index.mjml`);
let mjml = await fs.readFile(mjmlPath, { encoding: "utf-8" });

const assets = (await fs.readdir(path.resolve("content", emailName))).filter(
  (filename) => !filename.endsWith(".mjml")
);
for (const assetName of assets) {
  mjml = mjml.replaceAll(
    `"${assetName}"`,
    `"<%= it.static_url %>/${emailName}/${assetName}"`
  );
}

const { html, errors, json } = mjml2html(
  mjml,
  makeOptions(mjmlPath, {
    include_footer: true,
    static_url: PRODUCTION_URL,
    permalink: `${PRODUCTION_URL}/${emailName}`,
  })
);
if (errors.length) {
  console.log(errors);
}

const subject = json.children
  .find((n) => n.tagName === "mj-head")
  ?.children.find((n) => n.tagName === "mj-title")?.content;
if (!subject) {
  throw new Error("Missing subject (<mj-title>)");
}

const text = htmlToText(html);

const createMessage = (to: string, test?: boolean) => ({
  To: to,
  From: "Bed-Stuy Strong <bedstuystrong@bedstuystrong.com>",
  Subject: test ? `[test] ${subject}` : subject,
  HtmlBody: html,
  TextBody: text,
  Tag: "newsletter",
  MessageStream: "broadcast",
});

const postmarkClient = new postmark.ServerClient(
  process.env.POSTMARK_SERVER_API_TOKEN!
);
const TEST_LIST = process.env.TEST_EMAIL_LIST?.split(",") ?? [];
console.log("Test list:", TEST_LIST);
if (await confirm({ message: "Send test email?" })) {
  if (TEST_LIST.length === 0) throw new Error("need test emails");

  const testBatch = TEST_LIST.map((toEmail) => createMessage(toEmail, true));

  const testResult = await Promise.allSettled([
    postmarkClient.sendEmailBatch(testBatch),
  ]);
  console.log(testResult);

  await fs.writeFile(
    `${emailName}-test-send-log-${Date.now()}.json`,
    JSON.stringify(testResult),
    {
      encoding: "utf-8",
    }
  );
}

if (await confirm({ message: "Send real email?" })) {
  console.log("Fetching contact list...");
  const contactsTable = new AirtableBase("emails").table("contacts");
  const contacts = (
    await contactsTable._table
      .select({
        view: "not_suppressed",
        fields: ["email"],
      })
      .all()
  ).map((record) => contactsTable.normalize(record).email);

  console.log(`Found ${contacts.length} contacts`);

  const messages = contacts.map((toEmail) => createMessage(toEmail));
  const chunks: Message[][] = [];

  const START_INDEX = 0;
  messages.splice(0, START_INDEX);

  while (messages.length > 0) {
    const chunk = messages.splice(0, 500);
    chunks.push(chunk);
  }

  console.log(`Sending in ${chunks.length} chunks of 500`);

  const sendResult = await Promise.allSettled(
    chunks.map(async (chunk) => {
      await sleep(5000);
      return await postmarkClient.sendEmailBatch(chunk);
    })
  );

  console.log(sendResult);

  await fs.writeFile(
    `${emailName}-send-log-${Date.now()}.json`,
    JSON.stringify(sendResult),
    {
      encoding: "utf-8",
    }
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
