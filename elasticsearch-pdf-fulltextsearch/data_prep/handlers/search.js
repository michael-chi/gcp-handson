var http = require('http');
const requestAsync = (options, postData = null) => new Promise((resolve, reject) => {
    const isPost = options && options.method === "POST" && postData !== null;
    if (isPost && (!options.headers || !options.headers["Content-Length"])) {
        if(typeof postData == 'object')
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
            console.log(`data retrived from elasticsearch:${chunk}`);
            body.push(chunk);
        });
        res.on('end', () => {
            res.body = Buffer.concat(body);
		res.body = res.body.toString();
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
//  content => {question:'', answer:'', name:'', file:''}

async function search(host, path, port, term) {
    const options = {
        hostname: host,
        port: port,
        path: path,
        method: 'POST'
    };
    try {
        const res = await requestAsync(options,JSON.stringify(
		{
			query: {query_string:{query:term}}
		}
	));
//console.log(`========>${res.body}`);
        return res.body;
    } catch (e) {
        console.error(e);
    }
}
module.exports = class Searcher {
    constructor(host, path, port) {
        this.HOST = host;
        this.PATH = path.endsWith('/') ? path : `${path}/`;
	this.PATH = this.PATH + '_search';
        this.PORT = port;
    }

    //  content => {question:'', answer:'', name:'', file:''}
    async search(term) {
        //`faq/faq/_search`
        let result = await search(this.HOST, this.PATH, this.PORT, term);
	return result;
    }
}
