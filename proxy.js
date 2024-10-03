   // proxy.js
   const express = require('express');
   const { createProxyMiddleware } = require('http-proxy-middleware');

   const app = express();
   const targetUrl = 'http://example.com'; // Replace with your target endpoint

   // Middleware to log request details
   app.use((req, res, next) => {
       console.log(`Request: ${req.method} ${req.url}`);
       console.log('Headers:', req.headers);
       next();
   });

   // Proxy middleware
   app.use('/', createProxyMiddleware({
       target: targetUrl,
       changeOrigin: true,
       onProxyRes: (proxyRes, req, res) => {
           let body = [];
           proxyRes.on('data', chunk => {
               body.push(chunk);
           });
           proxyRes.on('end', () => {
               body = Buffer.concat(body).toString();
               console.log(`Response from ${targetUrl}:`);
               console.log('Status:', proxyRes.statusCode);
               console.log('Headers:', proxyRes.headers);
               console.log('Body:', body);
           });
       }
   }));

   // Start the server
   const PORT = 3000;
   app.listen(PORT, () => {
       console.log(`Proxy server is running on http://localhost:${PORT}`);
   });