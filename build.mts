import fs from "fs-extra";
import path from "node:path";
import { parseArgs } from "node:util";
import Fastify from "fastify";
import { fastifyStatic } from "@fastify/static";
import mjml2html from "mjml";
import postmark from "postmark";

import { makeOptions } from "./mjml.mts";

await fs.emptyDir(path.resolve("dist"));

await fs.cp("static", "dist", { recursive: true });

const emails = (await fs.readdir("content", { withFileTypes: true }))
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

await Promise.all(
  emails.map(async (emailName) => {
    await fs.mkdir(path.join("dist", emailName));

    const mjmlPath = path.resolve("content", `${emailName}/index.mjml`);
    const includePath = path.resolve("includes");

    const mjml = await fs.readFile(mjmlPath, { encoding: "utf-8" });
    const options = makeOptions(mjmlPath, includePath, {
      include_footer: false,
      permalink: `${process.env.URL}/${emailName}`,
    });
    const { html, errors, json } = await mjml2html(mjml, options);
    if (errors?.length) {
      console.log(errors);
    }
    await fs.writeFile(path.join("dist", emailName, "index.html"), html, {
      encoding: "utf-8",
    });

    const assets = (
      await fs.readdir(path.resolve("content", emailName))
    ).filter((filename) => !filename.endsWith(".mjml"));

    await Promise.all(
      assets.map(
        async (filename) =>
          await fs.copyFile(
            path.resolve("content", emailName, filename),
            path.resolve("dist", emailName, filename),
          ),
      ),
    );
  }),
);
