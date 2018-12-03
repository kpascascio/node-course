const http = require('http');
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const https = require('https');
const fs = require('fs');
const handlers = require('./handlers')
const helpers = require('./helpers')
const path = require('path')

const server = {};

server.httpServer = http.createServer((req, res) => server.unifiedServer(req, res))

server.httpsOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
}
server.httpsServer = https.createServer(server.httpsOptions, (req, res) => server.unifiedServer(req, res))

server.unifiedServer = function (req, res) {
    const parsedUrl = url.parse(req.url, true);

    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    const queryString = parsedUrl.query;

    const method = req.method.toLowerCase();
    const headers = req.headers;

    // getting payload if there is one 

    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    // node deals a lot with things called streams. bits of information that comes in little by little
    //  this is true for getting the payload data, so we need a variable to hold all the bits (buffer). 
    //  and we are going to work with the event listener on the req to append the data to this string over time

    req.on('data', (data) => {
        buffer += decoder.write(data)
    })


    req.on('end', () => {
        buffer += decoder.end()

        const chosenHandler = typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : handlers.notFound

        const data = {
            trimmedPath,
            queryString,
            method,
            headers,
            'payload': helpers.parseJsonToObj(buffer)
        }

        chosenHandler(data, function (statusCode, payload, contentType) {

            contentType = typeof contentType == 'string' ? contentType : 'json'
            statusCode = typeof statusCode == 'number' ? statusCode : 200;

            let payloadString = '';
            
            if (contentType == 'json') {
                res.setHeader('Content-Type', 'application/json')
                payload = typeof payload == 'object' ? payload : {};
                
                console.log('here')
                payloadString = JSON.stringify(payload);
            }

            if (contentType == 'html') {
                res.setHeader('Content-Type', 'text/html')
                payloadString = typeof payload == 'string' ? payload : '';
            }
            res.writeHead(statusCode)
            res.end(payloadString)
        })

    })
}

server.router = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checkList,
    'checks/create': handlers.checkCreate,
    'checks/edit': handlers.checkEdit,
    'checks/deleted': handlers.checkDeleted,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/token': handlers.token,
    'api/checks': handlers.checks
};

server.init = () => {
    server.httpServer.listen(config.http, () => {
        console.debug('\x1b[35m%s\x1b[0m', 'server is listening on port ' + config.http)
    })


    server.httpsServer.listen(config.https, () => {
        console.debug('\x1b[34m%s\x1b[0m', 'server is listening on port ' + config.https)
    })
}
module.exports = server;