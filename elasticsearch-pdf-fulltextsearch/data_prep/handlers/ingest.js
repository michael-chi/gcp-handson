
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
async function index(host, path, port, data) {
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
        const res = await requestAsync(options, {
            question:data.question,
            answer:data.answer,
            filename:data.file
        });
        return resizeTo;
    } catch (e) {
        console.error(e);
    }
}
//  content => {question:'', answer:'', name:'', file:''}
async function process(HOST, PATH, PORT, content) {
    console.log(`path=${PATH}${content.file}`);
    let res = await index(HOST, `${PATH}${pair.filename}`, PORT, content);
    return res.toString();
    /*
    export id=1
    export json_file=/home/tmp/1.pdf.json
    curl -X POST 'http://10.140.0.13:9200/faq/faq/${id}' --header 'Context-Type: application/json' -d @'${json_file}'
    */
}

module.exports = class Indexer {
    constructor() {

    }

    //  content => {question:'', answer:'', name:'', file:''}
    async index(content) {
        //`faq/faq/${pair.filename}`
        var path = `${process.env.ES_PATH}`.endsWith('/') ? `${process.env.ES_PATH}` : `${process.env.ES_PATH}/`;
        return await process(process.env.ES_HOST, `${path}`, process.env.ES_PORT, content);
    }
}
