class BadgeGraph extends Graph {
    _modeAdd = false;
    _rootObj = {
        id: "root",
        label: "SEARCH"
    };
    _onLabelClick = (e, d) => {
        e.stopPropagation();
        e.preventDefault();
        console.log(d)
    };
    _duration = 750;
    _nodePadding = {
        top: 5,
        right: 10,
        bottom: 5,
        left: 10,
    };
    _defaultColor = d3.scaleOrdinal(d3.schemePastel2)
    _margin = {
        top: 20,
        right: 180,
        bottom: 30,
        left: 90,
    };
    _theme = null;
    _collapsed = [];

    _source = null;
    _i = 0;

    _nodes = [];
    _links = [];
    _treemap = null;

    _depth = null;
    _onDeleteClicked = () => {};

    constructor(data, depthToCollapse = null, rootObj = null , modeAdd = false) {
        super()
        this._modeAdd = modeAdd;
        this._data = this._preprocessData(data);
        if(rootObj){
            this._rootObj = rootObj;
        }
        this._depth = depthToCollapse;
    }

    setTheme(value){
        this._theme = value;
    }
    setOnDeleteClicked(callback) {
        this._onDeleteClicked = callback;
    }

    setOnLabelClick(callback) {
        this._onLabelClick = callback;
    }

    _preprocessResultsByTheme(results){
        let countTag = 0;
        let res = this._rootObj;
        let raw = []
        const tags = new Set()
        for (const [id, value] of Object.entries(results)) {
            const row = {
            id,
            ...value
            }
            row.label = value.name
            row.description = value.description
            row.img = value.profilMediumImageUrl
            let hasTheme = false;
            if(row.tags){
                for (const tag of row.tags) {
                    for (const [theme, themeTagsObj] of Object.entries(this._theme)) {
                        for (const themeTag of Object.values(themeTagsObj)) {
                            if(tag == themeTag){
                                hasTheme = true;
                                raw.push({...row, theme})
                                tags.add(tag);
                            }
                        }
                    }
                }
            }
        }
        // for (const tag of [...tags]) {
        //     for (const [theme, themeTagsObj] of Object.entries(this._theme)) {
        //         for (const themeTag of Object.values(themeTagsObj)) {
        //             if(tag == themeTag){
        //                 raw.push({theme, collection: 'tags', id: tag, label: tag})
        //             }
        //         }
        //     }
        // }
        this.tags = [...tags];
        if(this._authorizedTags.length > 0){
            this.tags = this._authorizedTags;
        }
        console.log(raw);
        const typesGroup = d3.group(raw, d => d.theme, d => d.collection, d => d.type);
        let children = parcours(typesGroup);
        function parcours(map) {
            let children = []
            if(map instanceof Map){
                for (const [key,value] of map) {
                    if(key){
                        children.push({id: key, label: key, children: parcours(value)})
                    }else{
                        children = parcours(value);
                    }
                }
            }else{
                return map;
            }
            return children;
        }
        res.children = children
        return res
    }

    _preprocessResultsDefault(results){
        let countTag = 0;
        let res = this._rootObj;
        let raw = []
        const tags = new Set()
        for (const [id, value] of Object.entries(results)) {
            const row = {
            id,
            ...value
            }
            row.label = value.name
            row.description = value.description
            row.img = value.profilMediumImageUrl
            raw.push(row);
            if(row.tags){
                for (const tag of row.tags) {
                    tags.add(tag);
                }
            }
        }
        this.tags = [...tags];
        // for (const tag of [...tags]) {
        //     raw.push({
        //             label: tag,
        //             id : tag,
        //             group : 'tags',
        //             collection : 'tags',
        //     })
        // }
        if(this._authorizedTags.length > 0){
            this.tags = this._authorizedTags;
        }
        const typesGroup = d3.group(raw, d => d.collection, d => d.type);
        let children = parcours(typesGroup);
        function parcours(map) {
            let children = []
            if(map instanceof Map){
                for (const [key,value] of map) {
                    if(key){
                        children.push({id: key, label: key, children: parcours(value)})
                    }else{
                        children = parcours(value);
                    }
                }
            }else{
                return map;
            }
            return children;
        }
        res.children = children
        return res
    }

    preprocessResults(results){
        super.preprocessResults(results);
        if(this._theme){
            return this._preprocessResultsByTheme(results);
        }else{
            return this._preprocessResultsDefault(results);
        }
    }
    _addPlusNode(rawData, depth){
        console.log(depth, rawData);
        if(rawData.children && rawData.children.length > 0){
            for (let i = 0; i < rawData.children.length; i++) {
                rawData.children[i] = this._addPlusNode(rawData.children[i], depth + 1);
            }
            rawData.children.push({id: "plus", name: "+", label: "+"})
        }else{
            rawData.children = [{id: "plus", name: "+", label: "+"}];
        }
        return rawData;
    }
    _preprocessData(rawData) {
        if(this._modeAdd){
            rawData = this._addPlusNode(rawData, 0);
        }
        console.log(rawData);
        rawData = d3.hierarchy(rawData);
        const w = this._width - this._margin.left - this._margin.right;
        const h = GraphUtils.heightByViewportRatio(w);
        rawData.x0 = h / 2
        rawData.y0 = 0

        this._source = rawData;

        this._treemap = d3
            .tree()
            .size([w, h])
            .nodeSize([75, 240])
            .separation((a, b) => {
                if (a.parent == b.parent) return 1.5;
                else return 2;
            });
        for (const d of rawData.descendants()) {
            if (this._collapsed.includes(d.data.id)) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
            }
        }
        return rawData;
    }
    draw(containerId) {
        this._beforeDraw()
        super.draw(containerId)
        this._zoom = d3.zoom().on("zoom", (e) => {
            this._rootG.attr("transform", e.transform);
            this._onZoom(e);
        });
        this._rootSvg.call(this._zoom);
        if(this._depth != null && this._depth >= 0){
            this.collapseAll(this._data, this._depth);
        }
        this._update(this._data);
        this._afterDraw()
        this._rootSvg.call(this._zoom.transform, d3.zoomIdentity.translate(this._margin.left, (this._margin.top + this._height / 2)))
    }

    adaptViewBoxByRatio(ratio = 16/7){
        const w = this._width + this._margin.right + this._margin.left
        const h =  GraphUtils.heightByViewportRatio(w,ratio);
        this._rootSvg
            .attr("viewBox", [0,0,w,h])
    }

    initZoom = () => { 
        if(!this._rootSvg) return;
        const currentZoom = d3.zoomTransform(this._rootSvg.node());

        this._rootSvg.call(this._zoom.transform, d3.zoomIdentity);
        const bound = this._rootG.node().getBoundingClientRect(); console.log(bound)
        this._rootSvg.call(this._zoom.transform, currentZoom);

        const containerBound = this._rootSvg.node().getBoundingClientRect();
        const k1 = isFinite(containerBound.width / bound.width) ? ((containerBound.width - 50) / bound.width): 1;
        const k2 = isFinite(containerBound.height / bound.height) ? ((containerBound.height - 50) / bound.height): 1;
        const k = (k1 > k2 ? k2 : k1);
        
        const currentViewBox = this._rootSvg.node().viewBox.baseVal;
        
        //ADAPT TRANSFORMATION INTO VIEWBOX SCOPE
        const wRatio = currentViewBox.width / containerBound.width;
        const hRatio = currentViewBox.height / containerBound.height;
        let tx = (containerBound.width / 2) - (bound.width / 2) * k;
        let ty = (containerBound.height / 2) - (bound.height / 2) * k + Math.abs(containerBound.y - bound.y) * k ;
        tx *= wRatio;
        ty *= hRatio;
        this._rootSvg.transition().call(this._zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k))
    }
    setColor(callback) {
        this._color = callback;
        if (this._isDrawed) {
            for (const color of this._colored) {
                if (color.node()) {
                    if (color.node() instanceof SVGElement) {
                        color.attr("fill", (d, i, n) => this._color(d, i, n))
                    } else if (color.node() instanceof HTMLElement) {
                        color.style("background-color", (d, i, n) => this._color(d, d.depth, n));
                    }
                }
            }
        }
    }
    updateData(data, draw = true) {
        this._nodes
        this._data = this._preprocessData(data);
        const tmp = this._duration;
        this._duration = 0
        if(this._depth != null && this._depth >= 0){
            this.collapseAll(this._data, this._depth);
        }
        if(draw){
            this._update(this._data)
        }
        this._duration = tmp;
    }
    _update(data) {
        this._beforeUpdate()
        var treeData = this._treemap(data);
        this._nodes = treeData.descendants();
        this._links = treeData.descendants().slice(1);
        var node_g;
        var node = this._rootG
            .selectAll("g.node")
            .data(this._nodes, (d) => d.id || (d.id = ++this._i));
        node.join(
            (enter) => {
                node_g = enter
                    .append("g")
                    .attr("class", "node")
                    .on("click", (e, d) => {
                        this._click(e, d);
                    })
                    .attr(
                        "transform",
                        (d) => "translate(" + this._source.y0 + "," + this._source.x0 + ")"
                    )
                const foreign = node_g.append("foreignObject")
                    .style("cursor", "pointer")
                    .attr("width", d => d.w = d.data.id != "plus" ? 100 : 40)
                    .attr("height",d => d.h = d.data.id != "plus" ? 100 : 40)
                    .attr("x", 0)
                    .style("overflow", "visible")
                    .attr("y", d => - d.h / 2)

                const div = foreign
                    .append("xhtml:div")
                    .style("height", "100%")
                    .style("width", "100%")
                    .style("display", "flex")
                    .style("justify-content", "center")
                    .style("align-items", "center")
                    .style("border-radius", d => d.data.id != "plus" ? "5px" : "50%")
                    .style("background-color", "white")
                    .style("border", "1px solid #455a64")
                    .style("position", "relative")
                div.filter(d => d.data.id == "plus")
                    .text(d => d.data.label)
                const divNode = div.filter(d => d.data.id != "plus")
                const imageNode = divNode.filter(d => d.data.profilMediumImageUrl)
                imageNode.append("xhtml:img")
                    .attr("src", d => d.data.profilMediumImageUrl)
                    .style("height", "90%")
                    .style("width", "90%")
                    .style("pointer-events", "none")
                imageNode.append("xhtml:div")
                    .attr("class", "badge-graph-label")
                    .style("position", "absolute")
                    .style("top", "100%")
                    .style("width", "100%")
                    .style("text-align", "center")
                    .text(d => d.data.name ? d.data.name : "badge")
                    .on('click', (e, d) => this._onLabelClick(e, d));
                const textNode = divNode.filter(d => !d.data.profilMediumImageUrl)
                textNode.append("xhtml:div")
                    .style("max-height", "90%")
                    .style("max-width", "90%")
                    .style("overflow-wrap", "break-word")
                    .style("overflow", "hidden")
                    .style("text-align", "center")
                    .attr("class", "badge-graph-label")
                    .text(d => d.data.name ? d.data.name : "Badge")
                    .on('click', (e, d) => this._onLabelClick(e, d));
                div.filter(d => d.data.locked)
                    .append("xhtml:div")
                    .style("height", "90%")
                    .style("width", "90%")
                    .style("background-color", "rgba(0,0,0,0.7)")
                    .style("position", "absolute")
                    .style("top", "50%")
                    .style("left", "50%")
                    .style("transform", "translate(-50%, -50%)")
                    .style("display", "flex")
                    .style("justify-content", "center")
                    .style("align-items", "center")
                    .append("xhtml:i")
                    .attr("class", "fa fa-2x fa-lock")
                    .style("color", "white")
                
                    
                const divNodeButtons = divNode
                    .filter(d => d.parent)
                    .append("xhtml:button")
                    .attr("class","button-delete-badge-parcours btn btn-danger")
                    .style("position", "absolute")
                    .style("top", "-10px")
                    .style("display", "none")
                    .style("height", "30px")
                    .style("width", "30px")
                    .style("padding", "3px 5px")
                    .on('click', (event, d) => {
                        event.stopPropagation();
                        this._onDeleteClicked(event, d);
                    })
                    
                divNodeButtons.append("xhtml:i")
                    .attr("class", "fa fa-trash")
                    .style("pointer-events", "none")

                divNode.on("mouseover", (event, d) => {
                        if(this._modeAdd){
                            d3.select(event.target)
                                .select("button")
                                .style("display", "inline")
                        }
                    })
                divNode.on("mouseout", (event, d) => {
                        if(this._modeAdd){
                            divNodeButtons.style("display", "none")
                        }
                    })
                this._colored.push(div)
                this._leaves.push(node_g);
            },
            (update) => {
                node_g
                    .transition()
                    .duration(this._duration)
                    .attr("transform", (d) => {
                        return "translate(" + d.y + "," + d.x + ")";
                    });
                update
                    .transition()
                    .duration(this._duration)
                    .attr("transform", (d) => {
                        return "translate(" + d.y + "," + d.x + ")";
                    });
            },
            (exit) => {
                exit
                    .transition()
                    .duration(this._duration)
                    .attr("transform", (d) => {
                        return "translate(" + this._source.y + "," + this._source.x + ")";
                    })
                    .style("opacity", 0)
                    .remove();

                exit.select("text").style("fill-opacity", 1e-6);
            }
            );
        var link = this._rootG
            .selectAll("path.link")
            .data(this._links, (d) => d.id)
            .style("stroke-width", 1);
        var linkEnter;
        link.join(
            (enter) => {
                linkEnter = enter
                    .insert("path", "g")
                    .attr("class", "link")
                    .attr("d", (d) => {
                        var o = {
                            x: this._source.x0,
                            y: this._source.y0,
                        };
                        return this._diagonal(o, o);
                    })
                    .style("stroke-width", 1);
            },
            (update) => {
                linkEnter
                    .transition()
                    .duration(this._duration)
                    .attr("stroke", "#929292")
                    .attr("fill", "none")
                    .attr("d", (d) => {
                        return this._diagonal(d, d.parent);
                    });
                update
                    .transition()
                    .duration(this._duration)
                    .attr("stroke", "#929292")
                    .attr("fill", "none")
                    .attr("d", (d) => {
                        return this._diagonal(d, d.parent);
                    });
            },
            (exit) => {
                exit
                    .transition()
                    .duration(this._duration)
                    .attr("d", (d) => {
                        var o = {
                            x: this._source.x,
                            y: this._source.y,
                        };
                        return this._diagonal(o, o);
                    })
                    .style("stroke-width", 1)
                    .remove();
            }
        );
        this._nodes.forEach((d) => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
        this._afterUpdate()
    }

    _diagonal(s, d) {
        let path
        let sy
        let dy
        if (s != d) {
            sy = s.y;
            dy = d.y;
            dy += d.w;
            path = `M ${sy} ${s.x}
            C ${(sy + dy) / 2} ${s.x},
            ${(sy + dy) / 2} ${d.x},
            ${dy} ${d.x}`;
        } else {
            path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
            ${(s.y + d.y) / 2} ${d.x},
            ${d.y} ${d.x}`;
        }
        return path;
    }
    collapseAll(data, depth){
        if(data.depth < depth){
            if(data.children){
                for (const child of Object.values(data.children)) {
                    this.collapseAll(child, depth);
                }
            }
        }else if(data.depth > depth){
            if(data.children){
                for (const child of Object.values(data.children)) {
                    this.collapseAll(child, depth + 1);
                }
            }
                return;
        }else{
            if(data.children){
                for (const child of Object.values(data.children)) {
                    this.collapseAll(child, depth + 1);
                }
            }
            data._children = data.children
            data.children = null;
        }
    }
    _click(e, d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
            this._collapsed.push(d.data.id)
        } else {
            if (d._children) {
                d.children = d._children;
                d._children = null;
                this._collapsed = this._collapsed.filter(e => e != d.data.id)
            } else {
                this._onClickNode(e, d)
            }
        }
        this._source = d
        this._update(this._data);
    }
}