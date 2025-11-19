import fs from 'node:fs/promises';
import path from 'node:path';
import Fastify from 'fastify';
import {fastifyStatic} from '@fastify/static';
import mjml2html from 'mjml';

import options from './.mjmlconfig.js';

const PORT = process.env.PORT || 3001;
const server = Fastify();

server.register(fastifyStatic, {
  root: path.join(import.meta.dirname, 'static'),
});

server.get('/', async function handler(request, response) {
  const emails = (await fs.readdir('content')).filter(filename => filename.endsWith(".mjml"));

  const html = emails.map((filename) => {
    const emailName = filename.replace(".mjml", "");
    return `<a href="/email/${emailName}">${emailName}</a>`
  }).join("<br />");
  return response.type('text/html').send(html);
})

server.get('/email/:emailName', async function handler(request, response) {
  const { emailName } = request.params;
  const { inline, ...query } = request.query;

  const mjml = await fs.readFile(path.resolve('content', `${emailName}.mjml`), {encoding: 'utf-8'});
  const {html, errors, json} = mjml2html(mjml, options.makeOptions({
    static_url: `http://localhost:${PORT}`
  }));
  console.log(json);

  return response.type('text/html').send(html);
});

try {
  await server.listen({ port: PORT });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}

