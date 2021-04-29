function splitWords(text) {
    const words = text.split(/\s+/g); // To hyphenate: /\s+|(?<=-)/
    if (!words[words.length - 1]) words.pop();
    if (!words[0]) words.shift();
    return words;
}

function measureWidth(text) {
    const context = document.createElement("canvas").getContext("2d");
    context.font = "12px sans-serif";
    const textMetrics = context.measureText(text);
    const res =
        Math.abs(textMetrics.actualBoundingBoxLeft) +
        Math.abs(textMetrics.actualBoundingBoxRight);
    return res;
}

function splitLines(text, width) {
    let res = [];
    if (measureWidth(text) < width) {
        return [text];
    } else {
        const words = splitWords(text);
        let lastLine = "";
        for (let i = 0; i < words.length; i++) {
            const element = words[i];
            const tmp = lastLine + " " + element;
            if (measureWidth(tmp) > width) {
                res.push(lastLine);
                lastLine = element;
            } else {
                lastLine = tmp;
            }
        }
        res.push(lastLine)
        return res;
    }
}