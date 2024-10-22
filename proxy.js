const express = require('express');
const fs = require('fs');
const yargs = require('yargs');
const path = require('path');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware'); // require('http-proxy-middleware');
const TIMEOUT = 30 * 60 * 1000;

// Create output directory with timestamp
const outputDir = `output_${Date.now()}`;
fs.mkdirSync(outputDir);

const app = express();
//app.use(express.json())

app.use((req, res, next) => {
    console.log('REQUEST--------------------------');
    let url = `${req.method} ${req.url}`;
    console.log(`Request: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body)
    next(); 
});

const proxyConfig = require('./data/proxyConfig.json');
const argv = yargs.argv;
const selectedConfig = argv._[0];

if (!selectedConfig || !proxyConfig.hasOwnProperty(selectedConfig)) {
  console.error(`Error: Invalid or missing configuration. Please provide a valid configuration name.`);
  console.error(`Available configurations: ${Object.keys(proxyConfig).join(', ')}`);
  process.exit(1);
}

const config = proxyConfig[selectedConfig];
app.use('/baseurl', createCustomProxy(config.baseurl, '/baseurl'));
app.use('/searchurl', createCustomProxy(config.searchurl, '/searchurl'));
app.use('/graphql', createCustomProxy(config.graphql, '/graphql'));

console.log(`Proxy configured for: ${selectedConfig}`);
console.log(`Base URL: ${config.baseurl}`);
console.log(`Search URL: ${config.searchurl}`);
console.log(`GraphQL URL: ${config.graphql}`);

function saveJsonToRandomFile(ppath, jsonData) {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const strippedPath = ppath.substring(1);
    const randomFileName = `data_${strippedPath}_${Date.now()}_${Math.floor(Math.random() * 1000)}.json`;
    fs.writeFile(path.join(__dirname, outputDir, randomFileName), jsonString, (err) => {
        if (err) {
            console.error('Error writing file', err);
        } else {
            console.log(`File '${randomFileName}' has been created with JSON content`);
        }
    });
}

function appendToFile(fileName, domain, uri) {
    let content;
    if (!uri.startsWith('http')) {
        content = `${domain}${uri}`;
    } else {
        content = domain;
    }
    const filePath = path.join(__dirname, outputDir, fileName);
    fs.appendFile(filePath, content + '\n', (err) => {
        if (err) {
            console.error('Error appending to the file', err);
        } else {
            console.log(`Content appended to '${fileName}' successfully!`);
        }
    });
}

function createCustomProxy(targetUrl, path) {
    let pathRewriteRule = "";
    if (path === '/graphql') {
        pathRewriteRule = "/graphql";
    }
    return createProxyMiddleware({
        target: targetUrl,
        // pathRewrite: {
        //     [`^${path}`]: pathRewriteRule,
        // },
        // proxyTimeout: TIMEOUT,
        // timeout: TIMEOUT,
        changeOrigin: true,
        selfHandleResponse: true,
        on: {
            proxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
                console.log(`RESPONSE--------------------------`);
                console.log('Status:', res.statusCode);
                console.log('Headers:', res.getHeaders());
                let url = req.url;
                appendToFile('data_urls.txt', targetUrl, url);
                data = buffer.toString('utf8');
                //console.log('Body:', data);
                saveJsonToRandomFile(path, JSON.parse(data));
                return buffer.toString('utf8');
            }),
        },
        logger: console,
    });
}
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
    console.log(`Output directory created: ${outputDir}`);
});