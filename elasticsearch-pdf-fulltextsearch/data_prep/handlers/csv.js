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

module.exports = class csv {
    constructor() {

    }
    
    //  Placeholder function
    //  content => {question:'', answer:'', name:'', file:''}
    parse(content) {
        return content;
    }
}
