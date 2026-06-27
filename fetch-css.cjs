const http = require('http');
http.get('http://localhost:3000/src/index.css', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data.slice(0, 500)));
}).on('error', console.error);
