import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PORT || 4173);
// Serve only the standalone app, never private files in the working directory.
const server = createServer(async (request, response) => {
  if (!['/', '/index.html'].includes(request.url?.split('?')[0])) {
    response.writeHead(404); response.end('Not found'); return;
  }
  try {
    const html = await readFile(new URL('../index.html', import.meta.url));
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(html);
  } catch {
    response.writeHead(500); response.end('Run npm run build first.');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Naming Lab: http://localhost:${port}`));
