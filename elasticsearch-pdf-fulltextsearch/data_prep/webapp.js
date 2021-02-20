"use strict";

var express = require('express')
var bodyParser = require('body-parser');
var http = require('http');

require('dotenv').config();

let Indexer = require('./handlers/ingest');
let indexer = new Indexer(process.env.ES_HOST, process.env.ES_PATH, process.env.ES_PORT);

indexer.createIndex();

function rawBody(req, res, next) {
    //req.setEncoding('utf8');
    req.rawBody = '';
    req.on('data', function (chunk) {
        req.rawBody += chunk;
    });
    req.on('end', function () {
        next();
    });
}
const app = express();

app.set('port', process.env.PORT || 8080);
//app.use(rawBody);
app.use(bodyParser.json());

/*
    {file:``,content:{question:'', answer:'', name:'', file:''}}
*/
app.post('/upload', async (req, res) => {
    if(req.is('application/json')){
        let data = req.body;
        let fn = req.body.file;
        let csv = require('./handlers/csv.js');
        let handler = new csv();
        let parsedData = handler.parse(data);

        let resp = await indexer.index(parsedData);
        res.status(200).json({message:resp});
    }
    else {
        res.status(500).json({ message: 'currently supports json only' });
    }
});

app.get('/search', (req, res) => {
    try {
        let term = req.query.term;
        let Search = require('./handlers/search');
        let search = new Search(process.env.ES_HOST, process.env.ES_PATH, process.env.ES_PORT, term);
        let result = await search.search(term);
        res.status(200).json(result);
    } catch (ex) {
        
    }
    res.send(req.body);
}
);
http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
