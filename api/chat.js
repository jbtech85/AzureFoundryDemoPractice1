import 'dotenv/config';
import Fastify from 'fastify';
import OpenAI from 'openai';

const fastify = Fastify({ logger: true });
const endpoint = process.env.AZURE_FOUNDRY_ENDPOINT;
const deployment = process.env.AZURE_MODEL_DEPLOYMENT;
const apiKey = process.env.AZURE_API_KEY;

if (!endpoint || !deployment || !apiKey) {
  fastify.log.error('Missing Azure credentials in .env');
  process.exit(1);
}

const openai = new OpenAI({
  baseURL: endpoint,
  apiKey: apiKey
});

fastify.addHook('onRequest', (req, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  done();
});

fastify.options('/api/chat', async (req, reply) => {
  reply.code(204).send();
});

fastify.post('/api/chat', async (req, reply) => {
  const { system, messages } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: deployment,
      messages: [
        { role: 'system', content: system },
        ...messages
      ],
      max_tokens: 800,
      temperature: 0.7,
      store: true
    });

    const replyText = completion.choices[0].message.content;
    return { reply: replyText };
  } catch (err) {
    fastify.log.error('Azure error: ' + err.message);
    return reply.code(502).send({ error: err.message });
  }
});

try {
  await fastify.listen({ port: 3001, host: 'localhost' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}