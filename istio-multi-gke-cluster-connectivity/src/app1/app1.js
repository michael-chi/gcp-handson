const serverPort = 8888;
var express = require('express');
var bodyParser = require('body-parser');
const expressApp = express().use(bodyParser.json());
expressApp.get('/app1', (req,res) => {
        try{
            console.log(`[INFO]===> TEST <===`);
        }catch(ex){
            console.log(`[ERROR]${ex}`);
        }
        res.send(JSON.stringify({message:'ok',from:'app1-istio'}));
    }
);
expressApp.get('/', (req,res) => {

    res.send('ok');
}
);
expressApp.listen(serverPort);    //  Cloud Run now only supports port 8080
console.log(`express server listening on port ${serverPort}...`);