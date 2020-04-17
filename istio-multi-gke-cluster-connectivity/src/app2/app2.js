
const serverPort = 9999;
var express = require('express');
var bodyParser = require('body-parser');
const expressApp = express().use(bodyParser.json());
expressApp.get('/app2', async (req, res) => {
    try {
        console.log(`[INFO]===> TEST <===`);
        const request = require('request');
        //var resp = await request('http://app1.default.svc.cluster.local:8888/app1');
        var remote = process.env.REMOTE_HOST
        var resp = await request(remote)
        console.log(`retrieved from app1:${resp.json()}`);
        res.send(JSON.stringify({message:resp.json(),from:'app2-istio'}));
        // request('http://app1.default.svc.cluster.local:8888/app1', { json: true }, (err, res, body) => {
        //     if (err) { return console.log(err); }
        //     res.send(JSON.stringify({message:body,from:'app2'}));
        // });
    } catch (ex) {
        console.log(`[ERROR]${ex}`);
    }
}
);
expressApp.get('/', (req,res) => {

    res.send('ok');
});
//start the web server
expressApp.listen(serverPort, () => {
    console.log(`Websocket server started on port ` + serverPort);
});