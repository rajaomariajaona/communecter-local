class GraphUtils {
    static rectCollide() {
        var nodes, sizes, masses
        var size = constant([0, 0])
        var strength = 1
        var iterations = 1

        function constant(_) {
            return function() {
                return _
            }
        }

        function force() {
            var node, size, mass, xi, yi
            var i = -1
            while (++i < iterations) {
                iterate()
            }

            function iterate() {
                var j = -1
                var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

                while (++j < nodes.length) {
                    node = nodes[j]
                    size = sizes[j]
                    mass = masses[j]
                    xi = xCenter(node)
                    yi = yCenter(node)

                    tree.visit(apply)
                }
            }

            function apply(quad, x0, y0, x1, y1) {
                var data = quad.data
                var xSize = (size[0] + quad.size[0]) / 2
                var ySize = (size[1] + quad.size[1]) / 2
                if (data) {
                    if (data.index <= node.index) {
                        return
                    }

                    var x = xi - xCenter(data)
                    var y = yi - yCenter(data)
                    var xd = Math.abs(x) - xSize
                    var yd = Math.abs(y) - ySize

                    if (xd < 0 && yd < 0) {
                        var l = Math.sqrt(x * x + y * y)
                        var m = masses[data.index] / (mass + masses[data.index])

                        if (Math.abs(xd) < Math.abs(yd)) {
                            node.vx -= (x *= xd / l * strength) * m
                            data.vx += x * (1 - m)
                        } else {
                            node.vy -= (y *= yd / l * strength) * m
                            data.vy += y * (1 - m)
                        }
                    }
                }

                return x0 > xi + xSize || y0 > yi + ySize ||
                    x1 < xi - xSize || y1 < yi - ySize
            }

            function prepare(quad) {
                if (quad.data) {
                    quad.size = sizes[quad.data.index]
                } else {
                    quad.size = [0, 0]
                    var i = -1
                    while (++i < 4) {
                        if (quad[i] && quad[i].size) {
                            quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                            quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                        }
                    }
                }
            }
        }

        function xCenter(d) {
            return d.x + d.vx + sizes[d.index][0] / 2
        }

        function yCenter(d) {
            return d.y + d.vy + sizes[d.index][1] / 2
        }

        force.initialize = function(_) {
            sizes = (nodes = _).map(size)
            masses = sizes.map(function(d) {
                return d[0] * d[1]
            })
        }

        force.size = function(_) {
            return (arguments.length ?
                (size = typeof _ === 'function' ? _ : constant(_), force) :
                size)
        }

        force.strength = function(_) {
            return (arguments.length ? (strength = +_, force) : strength)
        }

        force.iterations = function(_) {
            return (arguments.length ? (iterations = +_, force) : iterations)
        }

        return force
    }


    /**
     * 
     * @param {number} x1 x of first point
     * @param {number} y1 y of first point
     * @param {number} x2 x of second point
     * @param {number} y2 y of second point
     * @returns Eucludian distance between two points
     */
    static eucludianDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
    }


    /**
     * 
     * @param {string} text text to slugify
     * @returns Slugified text
     */

    static slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start of text
            .replace(/-+$/, ''); // Trim - from end of text
    }

    /**
     * 
     * @param {string} a the text of transform
     * @returns obj with key as tranform type and value array of value
     */
    static parseTransform(a) {
        var b = {};
        for (var i in (a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g))) {
            var c = a[i].match(/[\w\.\-]+/g);
            b[c.shift()] = c;
        }
        return b;
    }

    /**
     * 
     * @param {string} hex Color in string hex format
     * @param {number} lum value of luminance negative if darker and positive if lighter
     * @returns new color darker or lighter
     */
    static colorLuminance(hex, lum) {

        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#",
            c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        return rgb;
    }

    /**
     * 
     * @param {string} text Text to truncate
     * @param {number} max Max Caractere
     * @param {number} ellispsisText? the text to put at end of truncated text
     * @returns Truncated text
     */
    static truncate(text, max, ellispsisText = '...') {
        if(text){
            return (text.length > max) ? text.substr(0, max - 1) + ellispsisText : text;
        }else{
            return "";
        }
    }


    static splitWords(text) {
        const words = text.split(/\s+/g); // To hyphenate: /\s+|(?<=-)/
        if (!words[words.length - 1]) words.pop();
        if (!words[0]) words.shift();
        return words;
    }



    static splitLines(text) {
        const lineHeight = 12;
        const targetWidth = Math.sqrt(GraphUtils.measureWidth(text.trim()) * lineHeight)
        const words = GraphUtils.splitWords(text)
        let line;
        let lineWidth0 = Infinity;
        const lines = [];
        for (let i = 0, n = words.length; i < n; ++i) {
            let lineText1 = (line ? line.text + " " : "") + words[i];
            let lineWidth1 = GraphUtils.measureWidth(lineText1);
            if ((lineWidth0 + lineWidth1) / 2 < targetWidth) {
                line.width = lineWidth0 = lineWidth1;
                line.text = lineText1;
            } else {
                lineWidth0 = GraphUtils.measureWidth(words[i]);
                line = {
                    width: lineWidth0,
                    text: words[i]
                };
                lines.push(line);
            }
        }
        return lines;
    }

    static textRadius(lines) {
        const lineHeight = 20;
        let radius = 0;
        for (let i = 0, n = lines.length; i < n; ++i) {
            const dy = (Math.abs(i - n / 2 + 0.5) + 0.5) * lineHeight;
            const dx = lines[i].width() / 2;
            radius = Math.max(radius, Math.sqrt(dx ** 2 + dy ** 2));
        }
        return radius;
    }

    static measureWidth(text) {
        const context = document.createElement("canvas").getContext("2d");
        context.font = "1.1em Nunito";
        const textMetrics = context.measureText(text)
        const res = Math.abs(textMetrics.actualBoundingBoxLeft) +
            Math.abs(textMetrics.actualBoundingBoxRight)
        return text => res;
    }

    static squareInnerCircle(cx, cy, r, padding = 0) {
        const l = Math.sin(Math.PI / 4) * (r - padding);
        const x = cx - l;
        const y = cy - l
        const width = l * 2;
        const height = width;
        return {
            x,
            y,
            width,
            height
        }
    }

    static computeBoundVirtualNode(node){
        let bnd;
        let clone = node.cloneNode(true)
        clone.style.cssText = "position:fixed; top:-99999px; left: 50%; opacity:0;z-index: -1;"
        document.body.appendChild(clone);
        bnd = clone.getBoundingClientRect();
        clone.parentNode.removeChild(clone)
        return bnd;
    }

    static textfill(nodeSelector, textContainerSelector, maxFontPixels, alpha = 1){
		var fontSize = maxFontPixels;
		var ourText = $(textContainerSelector, nodeSelector);
		var maxHeight = $(nodeSelector).height();
		var maxWidth = $(nodeSelector).width();
		var textHeight;
		var textWidth;
		do {
		    ourText.css('font-size', fontSize);
		    textHeight = ourText.height();
		    textWidth = ourText.width();
		    fontSize = fontSize - alpha;
		} while ((textHeight > maxHeight || textWidth > maxWidth) && fontSize > 3);
    }
    static heightByViewportRatio(width, ratio = 16 / 7){
        return width / ratio;
    }
    static hasImage(d){
        return d.data.img != undefined && d.data.img.trim() != "";
    }
}