const serverPort = 9999;
var express = require('express');
var bodyParser = require('body-parser');
const expressApp = express().use(bodyParser.json());
expressApp.get('/app2-mc', async (req, res) => {
    try {
        var remote = process.env.REMOTE_HOST;
        console.log(`[INFO]===> TEST <===`);
        console.log(`[INFO]remote=${remote}`);
        const request = require('request');
        var resp = await request(remote);
        console.log(`retrieved from app1:${resp.json()}`);
        res.send(JSON.stringify({message:resp.json(),from:'app2-mc'}));
    } catch (ex) {
        console.log(`[ERROR]${ex}`);
    }
}
);
expressApp.get('/', (req,res) => {

    res.send('ok from express');
});
//start the web server
expressApp.listen(serverPort, () => {
    console.log(`Websocket server started on port ` + serverPort);
});