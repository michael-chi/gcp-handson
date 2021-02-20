const utf8 = require('utf8');
const fs = require('fs');
const http = require('http')
contents = {};

function getJsonContent(file) {
    return fs.readFileSync(file, 'utf8');
}
const requestAsync = (options, postData = null) => new Promise((resolve, reject) => {
    const isPost = options && options.method === "POST" && postData !== null;
    if (isPost && (!options.headers || !options.headers["Content-Length"])) {
        options = Object.assign({}, options, {
            headers: Object.assign({}, options.headers, {
                "Content-Length": Buffer.byteLength(postData)
            })
        });
    }
    const body = [];
    const req = http.request(options, res => {
        res.on('data', chunk => {
            body.push(chunk);
        });
        res.on('end', () => {
            res.body = Buffer.concat(body);
            resolve(res);
        });
        
    });

    req.on('error', e => {
        reject(e);
    });

    if (isPost) {
        req.write(postData);
    }
    req.end();
});
async function ingest(host, path, port, data) {
    console.log('running...');

    const options = {
        hostname: host,
        port: port,
        path: path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    // var res = await https.request(options);
    // console.log(`statusCode: ${res.statusCode}`)
    try {
        const res = await requestAsync(options, data);
        console.log(res.body.toString("utf8"));
    } catch (e) {
        console.error(e);
    }
}
async function go() {
    var folder = process.argv[2];//"/home/kalschi/pdf/pdf/";
    var files = fs.readdirSync(folder);
    for (const file of files) {
        if (file.endsWith("json")) {
            let dataBuffer = getJsonContent(folder + file);
            await ingest('10.140.0.6', `faq/faq/${file}`, 9200, dataBuffer);
            /*
            export id=1
            export json_file=/home/tmp/1.pdf.json
            curl -X POST 'http://10.140.0.13:9200/faq/faq/${id}' --header 'Context-Type: application/json' -d @'${json_file}'
            */
        }
    }
}
go();