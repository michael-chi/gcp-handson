const pdf = require('pdf-parse');
const utf8 = require('utf8');
const folder = "/home/kalschi/pdf/pdf/";
const fs = require('fs');
const files = fs.readdirSync(folder);
contents = {};
async function go() {
    for (const file of files) {
        if (file.endsWith(".pdf")) {
            var result = "";
            contents[file] = "";
            let dataBuffer = fs.readFileSync(folder + file);
            var result = await pdf(dataBuffer);
            var u_text = utf8.encode(result.text);
            var b = new Buffer(u_text);
            var s = b.toString('base64');
            const json = {document:s, name:file};
            fs.writeFileSync(folder + file + ".json", JSON.stringify(json));
        }
    }
}
go();