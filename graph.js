class Graph {
    _initZoom = null;
    _canZoom = null;
    _rootSvg = null;
    _rootG = null;
    _rootData = null;
    _beforeDraw = () => {};
    _afterDraw = () => {};
    _onClickNode = () => {};
    _onZoom = () => {};
    _defaultColor = d3.scaleOrdinal(['#F9C1C8', '#DCEEC2', '#FBE5C1', '#B6C5F0', '#CCEFFC']);

    /**
     * 
     * @param {any} d Data inside current node
     * @param {number} i Index of current node
     * @param {node[]} n array of node[]
     * @returns 
     */
    _color = (d, i, n) => {
        return this._defaultColor(i);
    };
    resetZoom() {

    }
    updateData(data) {

    }
    setOnZoom(callback) {
        this._onZoom = callback;
    }
    setOnClickNode(callback) {
        this._onClickNode = callback;
    }
    setColor(callback) {
        this._color = callback;
    }
    setBeforeDraw(callback) {
        this._beforeDraw = callback;
    }
    preprocessData(data) {
        return data;
    }
    draw(idSvg) {

    }
    setAfterDraw(callback) {
        this._afterDraw = callback;
    }
    get rootG() {
        return this._rootG;
    }
    get rootSvg() {
        return this._rootSvg;
    }
}




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
        return (text.length > max) ? text.substr(0, max - 1) + ellispsisText : text;
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

    static squareOuterCircle(x, y, width, height) {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2)
        return {
            cx,
            cy,
            r
        };
    }

}

class CircleGraph extends Graph {

    _circlePadding = 30;
    _splitRegex = /(?=[A-Z][a-z])|\s+/g;
    _padding = this._circlePadding - 10;
    _globalMaxX = -Infinity
    _globalMaxY = -Infinity
    _data = null;
    _nodes = [];
    _size = null;
    _funcGroup = null;
    w = 0;
    h = 0;
    /**
     * 
     * @param {*} data array of obj {img?: url, text?: string, id: string | number}
     * @param {*} funcGroup function to indicate which obj key to group
     */
    constructor(data, funcGroup) {
        super()
        this._funcGroup = funcGroup
        this._data = this.preprocessData(data)
    }
    preprocessData(data) {
        console.log("DATA", this._data)
        this._nodes = [];
        const d = this.group(data, this._funcGroup);
        this._dfs(d);
        const packed = d3.packSiblings(this._nodes);
        let minY = Infinity;
        let minX = Infinity;
        for (let i = 0; i < packed.length; i++) {
            const x = packed[i].x - packed[i].r;
            const y = packed[i].y - packed[i].r;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            const curr_x = packed[i]["r"] + packed[i]["dr"] + packed[i]["x"];
            const curr_y = packed[i]["r"] + packed[i]["dr"] + packed[i]["y"];
            if (this._globalMaxX < curr_x) this._globalMaxX = curr_x;
            if (this._globalMaxY < curr_y) this._globalMaxY = curr_y;
        }
        if (minX != 0) {
            if (minX < 0) {
                for (let i = 0; i < packed.length; i++) {
                    const x = (packed[i]["x"] += Math.abs(minX))
                }
            } else {
                for (let i = 0; i < packed.length; i++) {
                    packed[i]["x"] -= Math.abs(minX)
                }
            }
        }
        if (minY != 0) {
            if (minY < 0) {
                for (let i = 0; i < packed.length; i++) {
                    const y = (packed[i]["y"] += Math.abs(minY))
                }
            } else {
                for (let i = 0; i < packed.length; i++) {
                    packed[i]["y"] -= Math.abs(minY)
                }
            }
        }
        const enclose = d3.packEnclose(packed)
            // CALCUL the X and Y SIZE fitting the entire graph
        this.w = enclose.r * 2;
        this.h = this.w;
        console.log(d.descendants())
        return packed;
    }

    /**
     * 
     * @param {*} data 
     * @param {*} funcGroup 
     */
    group(data, funcGroup) {
        const group = d3.group(data, funcGroup);
        return d3.hierarchy(group).sum(d => d.size).sort((a, b) => b.value - a.value)
    }

    set circlePadding(value) {
        this._circlePadding = value;
        this._padding = this._circlePadding - 10;
    }

    _dfs(parent) {
        if (parent.children) {
            if (parent.children[0].children) { // not leaf
                for (let i = 0; i < parent.children.length; i++) {
                    this._dfs(parent.children[i])
                }
            } else { // leaf nodes

                for (let i = 0; i < parent.children.length; i++) {
                    parent.children[i]["x"] = parent.children[i]["x"] || Math.random() * 200 - 100;
                    parent.children[i]["y"] = parent.children[i]["y"] || Math.random() * 200 - 100;
                    if (parent.children[i]["data"].img) {
                        parent.children[i]["width"] = 60;
                        parent.children[i]["bw"] = parent.children[i]["width"];
                        parent.children[i]["height"] = 60;
                        parent.children[i]["bh"] = parent.children[i]["height"];

                    } else {
                        if (!parent.children[i]["textParts"]) {
                            const textParts = parent.children[i]["data"].label.split(this._splitRegex);
                            let maxWLen = -Infinity;
                            for (const parts of textParts) {
                                if (maxWLen < parts.length) {
                                    maxWLen = parts.length
                                }
                            }
                            maxWLen *= 10;
                            const len = textParts.length
                            parent.children[i]["textParts"] = textParts
                            parent.children[i]["maxWidthText"] = maxWLen
                        }

                        parent.children[i]["width"] = parent.children[i]["maxWidthText"] + 40;
                        parent.children[i]["bw"] = parent.children[i]["width"];
                        parent.children[i]["height"] = parent.children[i]["textParts"].length * 24 + 40;
                        parent.children[i]["bh"] = parent.children[i]["height"];
                    }
                }
                //POSITION CALCUL HERE
                const simulation = d3.forceSimulation()
                    .force("center", d3.forceCenter(0, 0))
                    .force("charge", d3.forceManyBody())
                    .force("collide", GraphUtils.rectCollide().size(d => {
                        return [d.bw, d.bh];
                    }))
                    .nodes(parent.children)
                    .stop()
                const n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
                for (var i = 0; i < n; ++i) {
                    simulation.tick();
                }
                parent.children["simulation"] = simulation;

                let minX = Infinity;
                let maxX = -Infinity;
                let minY = Infinity;
                let maxY = -Infinity;
                for (let i = 0; i < parent.children.length; i++) {
                    const x = Number(parent.children[i]["x"])
                    const y = Number(parent.children[i]["y"])
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (maxX < x) maxX = x;
                    if (maxY < y) maxY = y;
                }
                console.log(minX, minY);
                if (minX != 0) {
                    if (minX < 0) {
                        for (let i = 0; i < parent.children.length; i++) {
                            const x = (parent.children[i]["x"] += Math.abs(minX))
                            if (maxX < x) maxX = x;
                        }
                    } else {
                        for (let i = 0; i < parent.children.length; i++) {
                            parent.children[i]["x"] -= Math.abs(minX)
                        }
                    }
                }
                if (minY != 0) {
                    if (minY < 0) {
                        for (let i = 0; i < parent.children.length; i++) {
                            const y = (parent.children[i]["y"] += Math.abs(minY))
                            if (maxY < y) maxY = y;
                        }
                    } else {
                        for (let i = 0; i < parent.children.length; i++) {
                            parent.children[i]["y"] -= Math.abs(minY)
                        }
                    }
                }

                const minR = Math.max(maxX, maxY) / 2; // compute r for placing items (nodes)
                let r = minR;
                for (let i = 0; i < parent.children.length; i++) {
                    const x = parent.children[i]["x"];
                    const y = parent.children[i]["y"];
                    const width = parent.children[i]["bw"];
                    const height = parent.children[i]["bh"];
                    const hyp = Math.sqrt(width * width + height * height);
                    const currR = GraphUtils.eucludianDistance(minR, minR, x, y) + hyp;
                    if (r < currR) r = currR;
                }

                parent["r"] = r + this._circlePadding; // SUBSTRACT CIRCLE PADDING AT DRAWING
                parent["dr"] = parent["r"] - minR;
                this._nodes.push(parent);
            }
            // calcul couple le plus loin
        }
    }

    correctTextParentSize() {
        const svg = this._rootG
        const [x, y, w, h] = this._rootSvg.attr("viewBox").split(",")
        const dimension = svg.node().getBoundingClientRect();
        let k = Math.max(w, h) / Math.max(dimension.width, dimension.height);
        if (k > 2.5) {
            k = 2.5;
        }
        const parentTexts = d3.selectAll("textPath.parent-text");
        parentTexts.style("font-size", `${30 * k}px`);
    }

    draw(containerId, update = false) {
        this._beforeDraw()

        d3.select("#" + containerId).selectAll("svg#graph").remove();
        this._rootSvg = d3.select("#" + containerId)
            .insert("svg", ":first-child")
            .attr("id", "graph")
            // .attr("height", h)
            // .attr("width", w)
            .attr("viewBox", [0, 0, this.w, this.h])
        this._rootSvg.selectAll("*").remove();
        this._rootG = this._rootSvg
            .append("g")
            .attr("id", "circle-root")
            .attr("transform", "translate(0,50)")
        const zoomEvent = d3.zoom().on('zoom', (e) => {
            this._rootG.attr("transform", e.transform)
            this.correctTextParentSize();
            this._onZoom(e);
        })
        this._rootSvg.call(zoomEvent)
        const filter_ombre = this._rootSvg
            .append("defs")
            .append("filter")
            .attr("id", "ombre")
            .append("feDropShadow")
            .attr("flood-opacity", 0.3)
            .attr("dx", 0)
            .attr("dy", 1);
        this.updateData(this._data)
        this.correctTextParentSize();
        this._afterDraw();
    }
    updateData(data) {

        this._rootG.selectAll("g")
            .data(data, d => JSON.stringify(d.data))
            .join(enter => {
                console.log("ENTERED")
                const parent_g = enter.append("g");
                parent_g
                    .classed("divide", true)
                const path = parent_g
                    .append("path")
                    .attr("stroke", "none")
                    .attr("fill", "none")
                    .attr("id", d => `path-${GraphUtils.slugify(d["data"][0])}`)
                    .attr('d', d => `M ${d.x} ${d.y + d.r - this._padding} A 1 1 0 1 1 ${d.x} ${d.y - d.r + this._padding} M ${d.x} ${d.y - d.r + this._padding} A 1 1 0 1 1 ${d.x} ${d.y + d.r - this._padding} `)
                const text = parent_g
                    .append("text")
                    .append("textPath")
                    .style("font-size", "30px")
                    .classed("svg-text", true)
                    .classed("parent-text", true)
                    .attr("xlink:href", d => `#path-${GraphUtils.slugify(d["data"][0])}`)
                    .text(d => d.children[0].data.group)
                    .style("fill", (d, i) => GraphUtils.colorLuminance(this._color(d, i), -0.2))
                    .attr("text-anchor", "middle")
                    .attr("startOffset", "50%");
                const circle_parent = parent_g
                    .append("circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => d.r - this._circlePadding)
                    .attr("stroke", "none")
                    .attr("fill", (d, i) => this._color(d, i))
                    .attr("filter", "url(#ombre)")

                const leaf_svg = parent_g
                    .append("svg")
                    .style("overflow", "visible")
                    .classed("leaf-svg", true)
                    .attr("x", d => d.x - d.r + d.dr)
                    .attr("y", d => d.y - d.r + d.dr)
            })

        d3.selectAll("svg.leaf-svg")
            .selectAll("g")
            .data(d => d.children, d => {
                return (JSON.stringify(d.data))
            })
            .join(enter => {
                const leaf_svg_g = enter.append("g")
                    .classed("leaf-group", true)
                    // .attr("id", (d, j, n) => {
                    // console.log(d3.select(n[0]).node().parentNode.__data__)
                    // return `id${i}-${j}`
                    // })
                    .on("click", this._onClickNode)
                const imgs = leaf_svg_g
                    .filter(d => d.data.img)
                    .append("image")
                    .attr("xlink:href", d => d.data.img)
                    .attr("width", d => d.width)
                    .attr("height", d => d.height)
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                const rects = leaf_svg_g
                    .filter(d => !d.data.img)
                    .append("rect")
                    .attr("fill", "transparent")
                    .attr("stroke", "#455a64")
                    .style("opacity", "0.5")
                    .attr("rx", 5)
                    .on("click", this._onClickNode)
                const texts = leaf_svg_g
                    .filter(d => !d.data.img)
                    .append("text")
                    .attr("text-anchor", "middle")
                    .attr("y", d => (d.y))
                    .classed("text-leaf", true)
                const textSpans = texts.selectAll("tspan")
                    .data(d => d.data.label.split(this._splitRegex))
                    .join("tspan")
                    .attr("x", (_, i, j) => {
                        const d = j[i].parentNode.__data__;
                        const x = (d.x + d.width / 2)
                        return x;
                    })
                    .attr("dy", (d, i, j) => i != 0 ? 20 : 0)
                    .text(d => d + " ")

                for (const node_g of enter.selectAll("g").nodes()) {
                    const text = d3.select(node_g).select("text")
                    if (!text.node()) {
                        continue;
                    }
                    const bound = text.node().getBBox();
                    d3.select(node_g)
                        .select("rect")

                    .attr("x", bound.x - 10)
                        .attr("y", bound.y - 10)
                        .attr("height", bound.height + 20)
                        .attr("width", bound.width + 20)
                }
            }, update => {
                console.log(update)
            }, exit => {
                console.log(exit)
            })

    }
}





class GraphTooltip {
    _defaultImage = null;
    _last = null;
    _node = null;
    _titleContainer = null;
    _image = null;
    _anchor = null;
    _description = null;
    _parent = null;
    tooltip = null;

    constructor(containerId) {
        this._parent = containerId;
        this.tooltip = d3.select("#" + containerId)
            .style("position", "relative")
            .style("overflow", "hidden")
            .append("xhtml:div")
            .attr("id", "graph-tooltip")
            .style("width", "350px")
            .style("display", "none")
            .html(`<div class="container-fluid">
        <div class="row">
            <div class="col-xs-12" style="display: flex; align-items: center;">
                <div style="margin-right: 10px;">
                    <div id="bulle-image" style="height: 50px; width: 50px; display: block; border-radius: 50%; background-image: url(<?php echo $defaultImage ?>); background-size: contain; background-repeat: no-repeat; background-position: center center;">
                    </div>

                </div>
                <h3 style="display: block; font-size: 0.9em" id="bulle-title">Titre</h3>
            </div>
        </div>
        <div class="row" id="bulle-description">
            <div class="col-xs-12">
                <span style="display: block; border-bottom: 1px solid #455a64; font-size: 1.1em; margin-bottom: 10px;">Description</span>
            </div>
            <div class="col-xs-12">
                <p class="description" style="font-size: 0.8em; text-align: justify;">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit. Veniam quos, odio id suscipit qui tempore.
                </p>
            </div>
        </div>
        <div class="row">
            <div class="col-xs-12" style="text-align: center;">
                <a class="btn btn-more lbh-preview-element" id="bulle-anchor" href="#page.type.organizations.id.60631a86c7f7b859ca733385" onclick="tooltip.hide();">
                    En savoir plus
                </a>
            </div>
        </div>
    </div>
    <div class="bulle-arrow"></div>`)
        this._title = this.tooltip.select("#bulle-title");
        this._image = this.tooltip.select("#bulle-image");
        this._anchor = this.tooltip.select("#bulle-anchor");
        this._description = this.tooltip.select("#bulle-description");
    }

    set defaultImage(img) {
        this._defaultImage = img;
    }
    set node(n) {
        this._node = n;
    }
    goToNode() {
        if (this._node != null && this._node.node()) {
            const n = $(this._node.node())
            var childPos = n.offset();
            const bnd = this._node.node().getBoundingClientRect();
            var parentPos = $("#" + this._parent).offset();
            const style = {
                top: childPos.top - parentPos.top,
                left: childPos.left - parentPos.left
            }
            this.tooltip
                .style("top", style.top + "px")
                .style("left", (style.left + bnd.width / 2) + "px")
                .style("transform", `translate(-50%,calc(-100% - 20px ))`)
        }
    }
    setContent(data) {
        if (data == this._last)
            return
        const d = data.data;
        if (d.img) {
            this._image.style("background-image", `url(${d.img})`)
        } else {
            this._image.style("background-image", `url(${this.defaultImage})`)
        }
        this._title.text(d.label)

        if (d.description) {
            this._description.style("display", 'block')
                .select("p.description")
                .text(GraphUtils.truncate(d.description.replace(/(<([^>]+)>)/gi, ""), 150))
        } else {
            this._description.style("display", 'none')
        }
        this._anchor.attr("href", `#page.type.organizations.id.${d.id}`)
        this._last = data;
    }
    show() {
        this.tooltip.style("display", "block")
    }
    hide() {
        this.tooltip.style("display", "none")
    }
}