import Fastify from 'fastify';
import mjml2html from 'mjml';

import options from './.mjmlconfig';

const server = Fastify();

server.get('/email/:emailName', async function handler(request, reply) {
  const { emailName } = request.params;
  const { inline, ...query } = request.query;

  const html = mjml2html(mjml, options);

  return reply.type('text/html').send(html);
});

try {
  await server.listen({ port: process.env.PORT || 3001 });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}

