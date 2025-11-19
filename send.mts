import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import Fastify from "fastify";
import { fastifyStatic } from "@fastify/static";
import mjml2html from "mjml";
import postmark from "postmark";

import { makeOptions } from "./mjml.mjs";

const { positionals } = parseArgs({ allowPositionals: true });
const emailName = positionals[0];
if (!emailName) throw new Error("Email name required");

try {
  await fs.access(path.resolve("content", emailName));
} catch (error) {
  throw new Error(`Couldn't find directory content/${emailName}`);
}

const mjmlPath = path.resolve("content", `${emailName}/index.mjml`);
const mjml = await fs.readFile(mjmlPath, { encoding: "utf-8" });
const { html, errors, json } = mjml2html(mjml, makeOptions(mjmlPath));
console.log(json);
