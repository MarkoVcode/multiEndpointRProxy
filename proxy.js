   // proxy.js
   const express = require('express');
   const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

   const {
    debugProxyErrorsPlugin, // subscribe to proxy errors to prevent server from crashing
    loggerPlugin, // log proxy events to a logger (ie. console)
    errorResponsePlugin, // return 5xx response on proxy error
    proxyEventsPlugin, // implements the "on:" option
  } = require('http-proxy-middleware');

   const app = express();
   const targetUrl = 'https://www-vdeprodlivessr.luxgroup.net'; // Replace with your target endpoint

   // Middleware to log request details
   app.use((req, res, next) => {
       console.log('works here');
       console.log(`Request: ${req.method} ${req.url}`);
       console.log('Headers:', req.headers);
       next();
   });

   // Proxy middleware
   app.use('/baseurl', createProxyMiddleware({
       target: targetUrl,
       changeOrigin: true,
       pathRewrite: {
        '/baseurl': ''
       },
       plugins: [debugProxyErrorsPlugin, loggerPlugin, errorResponsePlugin, proxyEventsPlugin],
       logger: console,
      // selfHandleResponse: true,
       logLevel: 'info',
    //    on: {
    //     proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    //       //res.statusCode = 418; // set different response status code
    //       console.log("interceptor")
    //       const response = responseBuffer.toString('utf8');
    //       return
    //       // response.replaceAll('Example', 'Teapot');
    //     })},
       on: {
         ProxyRes: (proxyRes, req, res) => {
           console.log("prox request");
           let body = [];
           proxyRes.on('data', chunk => {
               console.log("prox request 2");
               body.push(chunk);
           });
           proxyRes.on('end', () => {
               console.log("prox request 3");
               body = Buffer.concat(body).toString();
               console.log(`Response from ${targetUrl}:`);
               console.log('Status:', proxyRes.statusCode);
               console.log('Headers:', proxyRes.headers);
               console.log('Body:', body);
           });
      }}
   }
   ));

   app.get('/test', (req,res) => {
    console.log('test route');
    res.send('works');
   });

   // Start the server
   const PORT = 3000;
   app.listen(PORT, () => {
       console.log(`Proxy server is running on http://localhost:${PORT}`);
   });