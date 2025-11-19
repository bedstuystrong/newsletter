import fs from 'node:fs/promises';
import path from 'node:path';
import Fastify from 'fastify';
import {fastifyStatic} from '@fastify/static';
import mjml2html from 'mjml';

import options from './.mjmlconfig.js';

const PORT = process.env.PORT || 3001;
const server = Fastify();

server.register(fastifyStatic, {
  root: [path.join(import.meta.dirname, 'static'), path.join(import.meta.dirname, 'content')],
  prefixAvoidTrailingSlash: true
});
console.log(path.join(import.meta.dirname, 'static'))

server.get('/', async function handler(request, response) {
  const emails = (await fs.readdir('content', { withFileTypes: true })).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

  const html = emails.map((emailName) => {
    return `<a href="/${emailName}">${emailName}</a>`
  }).join("<br />");
  return response.type('text/html').send(html);
})

server.get('/:emailName', async function handler(request, response) {
  const { emailName } = request.params;
  const { inline, ...query } = request.query;

  try {
    await fs.access(path.resolve("content", emailName));
  } catch (error) {
    console.log(error)
    throw new Error(`Couldn't find directory content/${emailName}`);
  }

  const mjml = await fs.readFile(path.resolve('content', `${emailName}/index.mjml`), {encoding: 'utf-8'});
  const {html, errors, json} = mjml2html(mjml, options.makeOptions({
    static_url: `http://localhost:${PORT}`
  }));
  // console.log(json);

  return response.type('text/html').send(html);
});

try {
  await server.listen({ port: PORT });
} catch (err) {
  console.log(err)
  // server.log.error(err);
  process.exit(1);
}

