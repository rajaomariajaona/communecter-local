class VennGraph extends Graph {
    _sets = {}
    _minLeaf = 3;
    _maxCanDraw = 6;
    _canDraw = true;
    _splitRegex = /(?=[A-Z][a-z])|\s+/g;
    _padding = -10;
    constructor(rawData,authorizedTags = []) {
        super();
        if(Array.isArray(rawData) && rawData.length > 0){
            this._data = this._preprocessData(rawData);
            this._data = venn.layout(this._data);
        }else{
            this._data = [];
        }
        
        this._authorizedTags = authorizedTags;
    }

    preprocessResults(results){
        super.preprocessResults(results);
        const res = []
        var tagsSet = new Set();
        for (const [id, value] of Object.entries(results)) {
            var tags = value.tags;
            if(!tags){
                continue;
            }
            var groups = tags;
            if(this._authorizedTags && this._authorizedTags.length > 0){
                groups = tags.filter(x => this._authorizedTags.indexOf(x) !== -1);
            }
            if(!groups || !groups.length > 0){
                continue;
            }
            for (const group of groups) {
                tagsSet.add(group);
            }
            res.push({...value, id, groups, label: value.name ? value.name : "", img: value.profilMediumImageUrl})
        }
        this.tags = [...tagsSet];
        if(this._authorizedTags.length > 0){
            this.tags = this._authorizedTags;
        }
        return res
    }

    _preprocessData(dataRaws) {
        let data = {},
            existingMix = new Set(),
            allSets = {};
            
        for (const dataRaw of dataRaws) {
            const sets = dataRaw.groups
            sets.sort()
            const mix = sets.join(",");
            if(!Object.keys(data).includes(mix)){
                data[mix] = {
                    data: [],
                    sets: sets
                }
            }
            data[mix].data.push({
                data: dataRaw,
                sets
            });
            if(!Object.keys(allSets).includes(mix)){
                allSets[mix] = 1
            }else{
                allSets[mix]++
            }
            if(sets.length > 1){
                for (const set of sets) {
                    if(!Object.keys(allSets).includes(set)){
                        allSets[set] = 1
                    }else{
                        allSets[set]++
                    }
                }
            }
            existingMix.add(mix);
        }
        let cleanedAllSets = {}
        if(!this.authorizedTags){
            let setCounter = 0;
            for(const [k,v] of Object.entries(allSets)) {
                if(v >= this._minLeaf){
                    if(k.split(",").length == 1){
                        cleanedAllSets[k] = v;
                        setCounter++;
                    }
                }
            }
            function check(items, sets) {
                if(items.length > sets.length){
                    return false;
                }else{
                    for (const item of items) {
                        if(!sets.includes(item)){
                            return false;
                        }
                    }
                }
                return true;
            }
            const sets = Object.keys(cleanedAllSets);
            //SETS misy anle atome
            for(const [k,v] of Object.entries(data)){
                const items = k.split(",");
                if(items.length > 1){
                    if(check(items, sets)){
                        console.log("HERE")
                        cleanedAllSets[k] = allSets[k];
                    }
                }
            }
        }
        const result = {};
        if(this._canDraw){
            for (const [k,v] of Object.entries(cleanedAllSets)) {
                if(!Object.keys(data).includes(k)){
                    result[k] = {}
                    result[k].data = []
                    result[k].sets = [k]
                    result[k].size = cleanedAllSets[k]
                }else{
                    result[k] = data[k];
                    result[k].size = cleanedAllSets[k]
                    for (let i = 0; i < result[k].data.length; i++) {
                        result[k].data[i]["x"] = Math.random() * 100 - 50;
                        result[k].data[i]["y"] = Math.random() * 100 - 50;
                        if (result[k].data[i]["data"].img) {
                            result[k].data[i]["width"] = 60;
                            result[k].data[i]["bw"] = result[k].data[i]["width"];
                            result[k].data[i]["height"] = 60;
                            result[k].data[i]["bh"] = result[k].data[i]["height"];
                        } else {
                            if (!result[k].data[i]["textParts"]) {
                                const textParts = result[k].data[i]["data"].label.split(
                                    this._splitRegex
                                    );
                                    let maxWLen = -Infinity;
                                    for (const parts of textParts) {
                                        if (maxWLen < parts.length) {
                                            maxWLen = parts.length;
                                        }
                                }
                                maxWLen *= 14;
                                const len = textParts.length;
                                result[k].data[i]["textParts"] = textParts;
                                result[k].data[i]["maxWidthText"] = maxWLen;
                            }
                            const container = document.createElement("div");
                            const div = document.createElement("div");
                            container.appendChild(div)
                            div.innerHTML = result[k].data[i]["data"].label;
                            div.setAttribute("style", `width: ${result[k].data[i]["maxWidthText"]}px; padding: 20px;`)
                            const {width, height} = GraphUtils.computeBoundVirtualNode(container);
                            
                            result[k].data[i]["width"] = width;
                            result[k].data[i]["bw"] = width;
                            result[k].data[i]["height"] = height;
                            result[k].data[i]["bh"] = height;
                        }
                        if(result[k].data.length <= 2){
                            result[k].data[i]["x"] = - result[k].data[i]["width"] / 2;
                            result[k].data[i]["y"] = - result[k].data[i]["height"] / 2;
                        }
                    }
                    const simulation = d3
                    .forceSimulation()
                    .force("center", d3.forceCenter(0, 0))
                    .force("charge", d3.forceManyBody())
                    .force(
                        "collide",
                        GraphUtils.rectCollide().size((d) => {
                            return [d.bw, d.bh];
                        })
                        )
                        .nodes(result[k].data)
                        .stop();
                        const n = Math.ceil(
                            Math.log(simulation.alphaMin()) /
                            Math.log(1 - simulation.alphaDecay())
                            );
                            for (var i = 0; i < n; ++i) {
                                simulation.tick();
                            }
                }
            }
        }else{
            throw "CANNOT DRAW TOO MUCH DATA"
        }
        console.log("RES", result);
        return Object.values(result);
    }

    draw(containerId) {
        super.draw(containerId);
        this._rootG.append("g").attr("id", "venn-group");
        this._zoom = d3.zoom().on("zoom", (e) => {
            this._rootG.attr("transform", e.transform);
            this._correctTextParentSize();
            this._onZoom(e);
        });
        this._rootSvg.call(this._zoom);
        this._update();
        this._afterDraw()
    }

    adaptViewBoxByRatio(ratio = 16/7){
        this._height = GraphUtils.heightByViewportRatio(this._width,ratio);
        this._rootSvg
            .attr("viewBox", [0, 0,this._width,this._height]);
    }

    updateData(rawData, draw = true) {
        this._data = this._preprocessData(rawData);
        this._data = venn.layout(this._data);
        if(draw){
            this._update();
        }
    }
    _update(data) {
        this._beforeDraw();
        const g = this._rootG
            .selectAll('g.groups')
            .data(this._data)
            .join((enter) => {
                    const g = enter.filter(d => d.distinctPath.length > 6).append('g').classed("groups", true)
                    g.append("path").classed("paths", true);
                    g.append('circle');
                    g.append("g").classed("nodes-group", true)
                    const main_group = g.filter(d => d.circles.length == 1)
                    main_group
                        .append("path")
                        .attr("stroke", "none")
                        .attr("fill", "none")
                        .attr("id", (d) => `path-${GraphUtils.slugify(d.circles[0].set)}-${this._id}`)
                        .each(d => console.log(d))
                        .attr(
                            "d",
                            (d) =>
                            `M ${d.circles[0].x} ${d.circles[0].y + d.circles[0].radius - this._padding} A 1 1 0 1 1 ${d.circles[0].x} ${
                                d.circles[0].y - d.circles[0].radius + this._padding
                            } M ${d.circles[0].x} ${d.circles[0].y - d.circles[0].radius + this._padding} A 1 1 0 1 1 ${d.circles[0].x} ${
                                d.circles[0].y + d.circles[0].radius - this._padding
                            } `
                        );
                    const text = main_group
                        .append("text")
                        .append("textPath")
                        .style("font-size", "30px")
                        .classed("svg-text", true)
                        .classed("parent-text", true)
                        .attr(
                            "xlink:href",
                            (d) => `#path-${GraphUtils.slugify(d.circles[0].set)}-${this._id}`
                        )
                        .text((d) => d.circles[0].set)
                        .attr("fill", (d, i) =>
                            GraphUtils.colorLuminance(this._color(d, i), -0.2)
                        )
                        .attr("text-anchor", "middle")
                        .attr("startOffset", "50%");
                return g;
            });
        g.select('circle')
            .style("fill", "#cdc8c868")
            .style("stroke", "#cdc8c868")
            .attr('r', d => {
                let r = d.innerCircle.radius;
                if(r < 0){
                    return 0
                }
                if(r > 30){
                    r -= 5
                }
                return r
            })
            .attr('cx',(d) => d.innerCircle.x)
            .attr('cy',(d) => d.innerCircle.y);
        const paths = g.select('path')
            .attr('d', (d) => d.distinctPath)
            .style('fill', this._color);
        if(!this._colored){
            this._colored = []
        }
        this._colored.push(this._rootG.selectAll("path.paths"))
        this._rootG.selectAll("g.nodes-group")
            .selectAll("g.nodes")
            .data((d) => d.data.data,(d) => {
                return JSON.stringify(d);
            })
            .join(
                (enter) => {
                    const leaf_svg_g = enter
                        .append("g")
                        .style("cursor", "pointer")
                        .classed("nodes", true)
                        // .on("click", this._onClickNode);

                    this._leaves.push(leaf_svg_g);    
                    const foreign = leaf_svg_g
                    .append("foreignObject")
                    .style("overflow", "visible")
                    .attr("width", (d) => d.width)
                    .attr("height", (d) => d.height)
                    .attr("x", (d) => d.x)
                    .attr("y", (d) => d.y)
                    .style("transform-box", "fill-box")
                    .style("transform", "translate(-50%, -50%)")
                    
                    foreign.filter((d) => !d.data.img)
                        .append("xhtml:div")
                        .style("overflow", "hidden")
                        .style("text-align", "center")
                        .style("padding", "10px")
                        .style("display", "flex")
                        .style("justify-content", "center")
                        .style("align-items", "center")
                        .style("background-color", "transparent")
                        .style("color", "#455a64")
                        .style("border", "2px solid rgba(69, 90, 100, 0.5)")
                        .style("border-radius", "5px")
                        .text(d => d.data.label)
                        .on("click", this._onClickNode)
                        
                    foreign
                        .filter((d) => d.data.img)
                        .append("xhtml:div")
                        .style("overflow", "hidden")
                        .style("max-width", "100%")
                        .style("max-height", "100%")
                        .style("font-size", "6px")
                        .append("xhtml:img")
                        .attr("src", (d) => d.data.img)
                        .attr("alt", (d) => d.data.label)
                        .style("width", "100%")
                        .style("height", "auto")

                    this._leaves.push(foreign);

            });
            this._rootG
                .selectAll("g.nodes-group")
                .attr("transform", d => `translate(${d.innerCircle.x}, ${d.innerCircle.y}) scale(1)`)
                .each((d, i, n) => {
                    const bound = n[i].getBoundingClientRect();
                    const max = bound.width > bound.height ? bound.width : bound.height;
                    const k = (d.innerCircle.radius * 2) / max
                    if(!isFinite(k) || k < 0){
                        d.scale = 1
                    }else{
                        d.scale = k
                    }
                    console.log(d.scale);
                })
                .attr("transform", d => `translate(${d.innerCircle.x}, ${d.innerCircle.y}) scale(${d.scale})`)
        this._correctTextParentSize();
        this._afterDraw();
        
    }
    setColorMap(map){
        var colorFunction = (d, i, n) => {
            const key = d.data.sets.join(",")
            if(Object.keys(map).includes(key)){
                return map[key]
            }
            return this._defaultColor(i);
        };
        this.setColor(colorFunction)
    }
    _correctTextParentSize() {
        const svg = this._rootG;
        const [x, y, w, h] = this._rootSvg.attr("viewBox").split(",");
        const dimension = svg.node().getBoundingClientRect();
        let k = Math.max(w, h) / Math.max(dimension.width, dimension.height);
        if (k > 2.5) {
            k = 2.5;
        }
        if(k < 1){
            k = 1;
        }
        const parentTexts = this._rootSvg.selectAll("textPath.parent-text");
        parentTexts.style("font-size", `${12 * k}px`);
    }
}