class VennGraph extends Graph {
    _sets = {}
    _minLeaf = 5;
    _maxCanDraw = 10;
    _canDraw = true;
    _splitRegex = /(?=[A-Z][a-z])|\s+/g;
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
        let setCounter = 0;
        for(const [k,v] of Object.entries(allSets)) {
            if(v >= this._minLeaf){
                cleanedAllSets[k] = v;
                if(k.split(",").length == 1){
                    setCounter++;
                }
            }
        }
        if(setCounter > this._maxCanDraw){
            this._canDraw = false;
        }
        if(this._canDraw){
            for (const [k,v] of Object.entries(allSets)) {
                if(!Object.keys(data).includes(k)){
                    data[k] = {}
                    data[k].data = []
                    data[k].sets = [k]
                    data[k].size = allSets[k]
                }else{
                    data[k].size = allSets[k]
                    for (let i = 0; i < data[k].data.length; i++) {
                        data[k].data[i]["x"] = Math.random() * 100 - 50;
                        data[k].data[i]["y"] = Math.random() * 100 - 50;
                        if (data[k].data[i]["data"].img) {
                            data[k].data[i]["width"] = 60;
                            data[k].data[i]["bw"] = data[k].data[i]["width"];
                            data[k].data[i]["height"] = 60;
                            data[k].data[i]["bh"] = data[k].data[i]["height"];
                        } else {
                            if (!data[k].data[i]["textParts"]) {
                                const textParts = data[k].data[i]["data"].label.split(
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
                                data[k].data[i]["textParts"] = textParts;
                                data[k].data[i]["maxWidthText"] = maxWLen;
                            }
                            const container = document.createElement("div");
                            const div = document.createElement("div");
                            container.appendChild(div)
                            div.innerHTML = data[k].data[i]["data"].label;
                            div.setAttribute("style", `width: ${data[k].data[i]["maxWidthText"]}px; padding: 20px;`)
                            const {width, height} = GraphUtils.computeBoundVirtualNode(container);
                            
                            data[k].data[i]["width"] = width;
                            data[k].data[i]["bw"] = width;
                            data[k].data[i]["height"] = height;
                            data[k].data[i]["bh"] = height;
                        }
                        if(data[k].data.length <= 2){
                            data[k].data[i]["x"] = - data[k].data[i]["width"] / 2;
                            data[k].data[i]["y"] = - data[k].data[i]["height"] / 2;
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
                        .nodes(data[k].data)
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
        return Object.values(data);
    }

    draw(containerId) {
        super.draw(containerId);
        this._rootG.append("g").attr("id", "venn-group");
        this._zoom = d3.zoom().on("zoom", (e) => {
            this._rootG.attr("transform", e.transform);
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
                    const g = enter.append('g').classed("groups", true);
                    g.append("path").classed("paths", true);
                    g.append('circle');
                    g.append("g").classed("nodes-group", true)
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
}