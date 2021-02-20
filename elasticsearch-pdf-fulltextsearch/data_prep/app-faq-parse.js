const pdf = require('pdf-parse');
const utf8 = require('utf8');

const fs = require('fs');

contents = {};

function getCSVLineContent(line) {
    //  "xxx","ooo"
    var items = line.split(',');
    if (items[0] != null && items[0] != '') {
        var q = items[0].substring(0);
        var a = items[1].substring(0, items[1].length - 1);
        return { question: q, answer: a, name: q };
    }else{
        return null;
    }
}

async function go() {
    var folder = process.argv[2];//"/home/kalschi/pdf/pdf/";
    var out_dir = './';
    var files =fs.readdirSync(folder);
    for (const file of files) {

        if (file.endsWith(".pdf")) {
            var result = "";
            contents[file] = "";
            let dataBuffer = fs.readFileSync(folder + file);

            var result = await pdf(dataBuffer);
            var u_text = utf8.encode(result.text);
            var b = new Buffer(u_text);
            var s = b.toString('base64');
            const json = { question: '', answer: s, name: file };
            fs.writeFileSync(out_dir + file + ".json", JSON.stringify(json));
        } else if (file.endsWith("csv")) {
            let dataBuffer = fs.readFileSync(folder + file, 'utf8');
            var lines = dataBuffer.split('\n');

            var index = 0;
            lines.forEach(line => {
                var item = getCSVLineContent(line);
                if(item != null){
                    var fn = ut_dir + file + (index++) + ".json";
                    item.filename = file + (index++) + ".json";
                    console.log(`writting ${fn}`);
                    fs.writeFileSync(fn, JSON.stringify(item));               
                }
            });
 
        }
    }
}
go();