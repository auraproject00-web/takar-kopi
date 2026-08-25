const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  try {
    const books = await request({ hostname: 'localhost', port: 3000, path: '/api/books', method: 'GET' });
    console.log('Books API:', JSON.stringify(books.data, null, 2));

    const login = await request(
      { hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { username: 'admin', password: 'admin123', role: 'admin' }
    );
    console.log('Login API:', JSON.stringify(login.data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();