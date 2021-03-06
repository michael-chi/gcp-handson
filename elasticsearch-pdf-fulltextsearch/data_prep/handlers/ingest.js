var http = require('http');
const requestAsync = (options, postData = null) => new Promise((resolve, reject) => {
    const isPost = options && options.method === "POST" && postData !== null;
    if (isPost && (!options.headers || !options.headers["Content-Length"])) {
        if (typeof postData == 'object')
            postData = JSON.stringify(postData);
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
            res.body = res.body.toString();
            console.log(`[ingest]data retrived from elasticsearch:${res.body}`);

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
async function createIndex(host, path, port) {
    const options = {
        hostname: host,
        port: port,
        path: path,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    try {
        const res = await requestAsync(options, {
            mappings: {
                faq: {
                    properties: {
                        answer: {
                            type: "string"
                        },
                        question: {
                            type: "string"
                        },
                        name: {
                            type: "string"
                        }
                    }
                }
            }
        });
        return res.body;
    } catch (e) {
        console.error(e);
    }
}
async function index(host, path, port, data) {
    const options = {
        hostname: host,
        port: port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    try {
        let o = {
            question: data.question,
            answer: data.answer,
            filename: data.filename
        };

        const res = await requestAsync(options, JSON.stringify(o));
        return res.body;
    } catch (e) {
        console.error(e);
    }
}
//  content => {question:'', answer:'', name:'', file:''}
async function process(HOST, PATH, PORT, content) {
    let res = await index(HOST, `${PATH}${content.filename}`, PORT, content);
    return res;
}

module.exports = class Indexer {
    constructor(host, path, port) {
        this.HOST = host;
        this.PATH = path.endsWith('/') ? path : `${path}/`;
        this.PORT = port;
    }

    //  content => {question:'', answer:'', name:'', file:''}
    async index(content) {
        //`faq/faq/${pair.filename}`
        return await process(this.HOST, this.PATH, this.PORT, content);
    }
    async createIndex() {
        return await createIndex(this.HOST, this.PATH.split('/')[0], this.PORT);
    }
}
