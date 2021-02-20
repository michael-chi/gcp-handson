"use strict";

var express = require('express')
var bodyParser = require('body-parser');
var http = require('http');

require('dotenv').config();

const OUTPUT_DIR = "./outout/";

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

        let Indexer = require('./handlers/ingest');
        let indexer = new Indexer();

        await indexer.index(parsedData);
    }
    // else if (req.is('text/csv') || req.is('text/plain')) {
    //     //res.status(422).json();
    //     let dataBuffer = req.rawBody;
    //     var lines = dataBuffer.split('\n');

    //     var index = 0;
    //     lines.forEach(line => {
    //         var item = getCSVLineContent(line);
    //         if (item != null) {
    //             var fn = OUTPUT_DIR + file + (index++) + ".json";
    //             console.log(`writting ${fn}`);
    //             fs.writeFileSync(fn, JSON.stringify(item));
    //         }
    //     });

    // } 
    else {
        res.status(500).json({ message: 'currently supports json only' });
    }
});

app.get('/', (req, res) => {
    try {
        console.log(`[INFO]===> / <===`);
        console.log(`[INFO]${JSON.stringify(req.body)}`);
    } catch (ex) {
        console.log(`[ERROR]${ex}`);
    }
    res.send(req.body);
}
);
http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
