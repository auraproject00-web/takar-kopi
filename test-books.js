const { spawn } = require('child_process');
const http = require('http');

const server = spawn('node', ['server.js'], { stdio: ['ignore', 'pipe', 'pipe'] });

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function waitForServer() {
  for (let i = 0; i < 20; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/books', method: 'GET', timeout: 500 }, res => {
          res.on('data', () => {}); res.on('end', () => resolve());
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
      });
      return;
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Server not ready');
}

async function test() {
  try {
    await waitForServer();
    console.log('Server ready');

    const books = await request({ hostname: 'localhost', port: 3000, path: '/api/books', method: 'GET' });
    console.log('Books response:', JSON.stringify(books.data, null, 2));
  } catch (e) {
    console.error('Test failed:', e.message);
  } finally {
    server.kill();
  }
}

test();