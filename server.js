// file deepcode ignore DisablePoweredBy: example code
// file deepcode ignore UseCsurfForExpress: example code
const express = require('express');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware'); // require('http-proxy-middleware');
const TIMEOUT = 30*60*1000;

/**
 * Configure proxy middleware
 */
const jsonPlaceholderProxy = createProxyMiddleware({
  target: 'https://www-vdeprodlivessr.luxgroup.net',
  router: {
    '/baseurl': 'https://www-vdeprodlivessr.luxgroup.net',
    '/searchurl': 'https://www-vdeprodlivessr.luxgroup.net',
    '/cms': 'https://preview-stageprodvisiondirect.luxgroup.net/graphql',
  },
  pathRewrite: {
    '/cms': '',
    '/searchurl': '',
    '/baseurl': ''
   },
 // proxyTimeout: TIMEOUT,
 // timeout: TIMEOUT,
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  selfHandleResponse: true, // manually call res.end(); IMPORTANT: res.end() is called internally by responseInterceptor()
  on: {
    proxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
      //res.statusCode = 418;
      console.log(`RESPONSE--------------------------`);
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.getHeaders());
      let url = req.url;
      appendToFile('data_urls.txt', url);
      data = buffer.toString('utf8');
      console.log('Body:', data);
      saveJsonToRandomFile(JSON.parse(data));
      return buffer.toString('utf8');
    }),
  },
  logger: console,
});

const app = express();
//app.use(express.json())
/**
 * Add the proxy to express
 */
app.use((req, res, next) => {
  console.log('REQUEST--------------------------');
  let url = `${req.method} ${req.url}`;
  console.log(`Request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body)
  next();
});
app.use('/', jsonPlaceholderProxy);

function saveJsonToRandomFile(jsonData) {
  // Convert JSON object to string
  const jsonString = JSON.stringify(jsonData, null, 2);

  // Generate a random file name
  const randomFileName = `data_${Date.now()}_${Math.floor(Math.random() * 1000)}.json`;

  // Write the JSON string to the file
  fs.writeFile(path.join(__dirname, randomFileName), jsonString, (err) => {
    if (err) {
      console.error('Error writing file', err);
    } else {
      console.log(`File '${randomFileName}' has been created with JSON content`);
    }
  });
}

function appendToFile(fileName, content) {
  const filePath = path.join(__dirname, fileName);

  // Use fs.appendFile to append content to the file or create the file if it doesn't exist
  fs.appendFile(filePath, content + '\n', (err) => {
    if (err) {
      console.error('Error appending to the file', err);
    } else {
      console.log(`Content appended to '${fileName}' successfully!`);
    }
  });
}

   // Start the server
   const PORT = 3000;
   app.listen(PORT, () => {
       console.log(`Proxy server is running on http://localhost:${PORT}`);
   });