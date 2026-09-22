import { createServer } from 'node:http';

let received = null;
const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'content-type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Content-Type', 'application/json');
  if (request.method === 'OPTIONS') {
    response.writeHead(204).end();
  } else if (request.method === 'POST' && request.url === '/v1/traces') {
    const parts = [];
    for await (const chunk of request) parts.push(chunk);
    try {
      received = Buffer.concat(parts).toString('utf8');
      JSON.parse(received);
      response.writeHead(202).end('{}');
    } catch (error) {
      response.writeHead(400).end(JSON.stringify({ error: String(error) }));
    }
  } else if (request.method === 'GET' && request.url === '/received') {
    response.end(received || 'null');
  } else {
    response.end('{"ready":true}');
  }
});
server.listen(18082, '127.0.0.1', () => console.log('Telemetry collector ready on loopback18082'));
