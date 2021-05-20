class CircleGraph extends Graph {
    _textColored = []
    _circlePadding = 30;
    _splitRegex = /(?=[A-Z][a-z])|\s+/g;
    _padding = this._circlePadding - 10;
    _globalMaxX = -Infinity
    _globalMaxY = -Infinity
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
        this._data = this._preprocessData(data)
    }
    _preprocessData(data) {
        console.log("DATA", this._data)
        this._nodes = [];
        const d = this._group(data, this._funcGroup);
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
    _group(data, funcGroup) {
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

    _correctTextParentSize() {
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

    draw(containerId) {
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
            this._correctTextParentSize();
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
        this._update(this._data)
        this._correctTextParentSize();
        this._afterDraw();
    }

    _update(data) {
        this._leaves = [];
        this._colored = [];
        this._textColored = [];
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
                    .attr("fill", (d, i) => GraphUtils.colorLuminance(this._color(d, i), -0.2))
                    .attr("text-anchor", "middle")
                    .attr("startOffset", "50%");
                this._textColored.push(text)
                const circle_parent = parent_g
                    .append("circle")
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => d.r - this._circlePadding)
                    .attr("stroke", "none")
                    .attr("fill", (d, i) => this._color(d, i))
                    .attr("filter", "url(#ombre)")
                this._colored.push(circle_parent)
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

                this._leaves.push(leaf_svg_g);

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

                this._leaves.push(rects);

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
    setColor(callback) {
        super.setColor(callback);
        for (const text of this._textColored) {
            text.attr("fill", (d, i) => GraphUtils.colorLuminance(this._color(d, i), -0.2))
        }
    }
}