class RelationGraph extends Graph {
    _iconClass = "fa fa-users";
    _links = [];
    _linksNode = [];
    _groups = [];
    _groupsNode = [];
    _defaultColorGroup = d3.scaleOrdinal(d3.schemeCategory10);
    _pathPadding = 30;
    _clicked = false;
    _radius = 75;
    _groupRadius = 100;
    _marginCollide = 35;
    _coloredGroup = [];
    _minX = 0;
    _minY = 0;
    _onClickGroup = () => {};
    _colorGroup = (d, i, n) => {
        return this._defaultColorGroup(i);
    };

    get iconClass() {
        return this._iconClass;
    }
    set iconClass(icon) {
        this._iconClass = icon;
        this._groupsNode.selectAll("i").attr("class", this._iconClass);
    }

    setRadius(radius) {
        this._radius = radius;
    }
    setGroupRadius(radius) {
        this._groupRadius = radius;
    }
    setColorGroup(callback) {
        this._colorGroup = callback;
        for (const coloredGroup of this._coloredGroup) {
            coloredGroup.attr("fill", (d, i, n) => this._colorGroup(d, i, n));
        }
    }
    constructor(rawData,authorizedTags = []) {
        super();
        const {
            data,
            links,
            groups
        } = this._preprocessData(rawData);
        this._authorizedTags = authorizedTags;
        this._links = links;
        this._data = data;
        this._groups = groups;
    }

    preprocessResults(results){
        super.preprocessResults(results);
        const res = []
        var tags = new Set();
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
                tags.add(group);
            }
            res.push({...value, id, groups, label: value.name ? value.name : "", img: value.profilMediumImageUrl})
        }
        this.tags = [...tags];
        if(this._authorizedTags.length > 0){
            this.tags = this._authorizedTags;
        }
        return res
    }

    _preprocessData(dataRaws) {
        let data = [],
            links = [],
            groups = [];
        for (const dataRaw of dataRaws) {
            data.push({
                data: dataRaw,
            });
        }
        const tmpSets = new Set();
        for (let i = 0; i < data.length; i++) {
            const el = data[i];
            if (el.data.groups) {
                if (Array.isArray(el.data.groups)) {
                    for (const group of el.data.groups) {
                        tmpSets.add(group);
                        const source = el.data.id;
                        const target = group;
                        links.push({
                            source,
                            target,
                        });
                    }
                } else {}
            }
        }
        groups = Array.from(tmpSets);
        for (const group of groups) {
            data.push({
                data: {
                    id: group,
                    type: "group",
                },
            });
        }
        for (const d of data) {
            d.x = Math.random() * 100;
            d.y = Math.random() * 100;
        }
        var simulation = d3
            .forceSimulation(data)
            .force(
                "link",
                d3
                .forceLink(links)
                .id((d) => d.data.id)
                .distance(200)
                .strength(1)
            )
            // .force("center", d3.forceCenter().x(width * .5).y(height * .5))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("x", d3.forceX())
            .force(
                "collide",
                d3
                .forceCollide()
                .radius(
                    (d) =>
                    (d.data.type == "group" ? this._groupRadius : this._radius) +
                    this._marginCollide
                )
                .iterations(2)
            )
            .force("y", d3.forceY())
            .stop();
        const n = Math.ceil(
            Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())
        );
        for (var i = 0; i < n; ++i) {
            simulation.tick();
        }
        return {
            data,
            links,
            groups,
        };
    }

    draw(containerId) {
        super.draw(containerId);
        this._rootG.append("g").attr("id", "links-group");
        this._update();
        this._afterDraw()
    }

    adaptViewBoxByRatio(ratio = 16/7){
        this._height = GraphUtils.heightByViewportRatio(this._width,ratio);
        this._rootSvg
            .attr("viewBox", [0, 0,this._width,this._height]);
    }

    updateData(rawData) {
        const {
            data,
            links,
            groups
        } = this._preprocessData(rawData);
        this._links = links;
        this._data = data;
        this._groups = groups;
        this._update();
    }
    _update(data) {
        this._beforeDraw();
        this._rootG
            .select("g#links-group")
            .selectAll("line")
            .data(this._links, (d) => {
                return JSON.stringify(d);
            })
            .join((enter) => {
                this._linksNode = enter
                    .append("line")
                    .attr("stroke-width", 1.1)
                    .attr("stroke-opacity", 0.3)
                    .attr("stroke", "#999")
                    .attr("x1", (d) => d.source.x)
                    .attr("y1", (d) => d.source.y)
                    .attr("x2", (d) => d.target.x)
                    .attr("y2", (d) => d.target.y);
            });

        this._rootG
            .selectAll("g.leaf")
            .data(this._data, (d) => {
                // return JSON.stringify(d.data)
                return JSON.stringify(d);
            })
            .join((enter) => {
                const nodeSvg = enter
                    .append("g")
                    .classed("leaf", true)
                    .style("overflow", "visible")
                    .style("cursor", "pointer");
                const node = nodeSvg
                this._groupsNode = node.filter(
                    (d) => d.data.type && d.data.type == "group"
                );
                const path = this._groupsNode
                    .append("path")
                    .attr("stroke", "none")
                    .attr("fill", "none")
                    .attr("id", (d, i) => `group-${i}`)
                    .attr(
                        "d",
                        (d) =>
                        `M 0 ${this._groupRadius - this._pathPadding} A 1 1 0 1 1 0 ${
                -this._groupRadius + this._pathPadding
              } M 0 ${-this._groupRadius + this._pathPadding} A 1 1 0 1 1 0 ${
                this._groupRadius - this._pathPadding
              } `
                    );

                this._leaves = node.filter(
                    (d) => !d.data.type || d.data.type != "group"
                );
                const circle = this._leaves
                    .append("circle")
                    .attr("r", this._radius)
                    .attr("fill", (d, i) => (d.color = this._color(d, i)))
                this.leaves
                    .each(d => {
                        d.innerSquare = GraphUtils.squareInnerCircle(0,0,this._radius, 10);
                    })
                this._leaves
                    .append("foreignObject")
                    .attr("x", d => d.innerSquare.x)
                    .attr("y", d => d.innerSquare.y)
                    .attr("width", d => d.innerSquare.width)
                    .attr("height", d => d.innerSquare.height)

                this._leaves.on("click", this._onClickNode);
                this._zoom = d3.zoom().on("zoom", (e) => {
                    this._rootG.attr("transform", e.transform);
                    if (this._clicked) {
                        this._addMouseEvent(this._leaves, this._groupsNode);
                        this._clicked = false;
                    }
                    this._onZoom();
                });
                this._rootSvg.call(this._zoom);
                const circleGroup = this._groupsNode
                    .append("circle")
                    .attr("r", this._groupRadius)
                    .attr("fill", (d, i) => (d.color = this._colorGroup(d, i)));
                this._coloredGroup.push(circleGroup);
                this._groupsNode
                    .append("text")
                    .append("textPath")
                    .attr("text-anchor", "middle")
                    .style("fill", "white")
                    .style("font-size", "30px")
                    .attr("startOffset", "50%")
                    .attr("xlink:href", (d, i) => `#group-${i}`)
                    .text((d) => d.data.id);
                const fontSize = this._groupRadius * (2 / 3);
                this._groupsNode
                    .append("foreignObject")
                    .attr("x", -50)
                    .attr("y", -50)
                    .attr("width", 100)
                    .attr("height", 100)
                    .append("xhtml:div")
                    .style("width", "100%")
                    .style("height", "100%")
                    .style("display", "flex")
                    .style("justify-content", "center")
                    .style("align-items", "center")
                    .append("xhtml:i")
                    .style("font-size", fontSize + "px")
                    .style("color", "white")
                    .attr("class", (d) => this._iconClass);

                this._groupsNode.on("click", this._focusOnGroup);

                
                this._colored.push(circle);
                const div = this._leaves
                .selectAll("foreignObject")
                .append("xhtml:div")
                .style("width", "100%")
                .style("height", "100%")
                .style("display", "flex")
                .style("justify-content", "center")
                .style("align-items", "center")
                div
                    .filter((d) => d.data.img)
                    .append("xhtml:img")
                    .attr("src", (d) => d.data.img)
                    .style("width", "100%")
                    .style("height", "auto")
                const texts = div
                    .filter((d) => !d.data.img)

                texts.append("xhtml:span")
                    .style("text-align", "center")
                    .text(d => d.data.label)

                texts.each((d,i,n) => {
                    GraphUtils.textfill(n[i], 'span', 20);
                })
                nodeSvg.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
                this._addMouseEvent(this._leaves, this._groupsNode);
            });
            this._afterDraw();
    }

    _removeAllMouseEvent() {
        this._leaves.on("mouseover", null);
        this._leaves.on("mouseout", null);
        this._groupsNode.on("mouseover", null);
        this._groupsNode.on("mouseout", null);
        this._groupsNode.on("click", (e) => {
            e.stopPropagation();
        });
    }
    _leafMouseOver(e, data) {
        this._rootSvg.select("g#top-container").remove();
        this._leaves.each((d,i,n) => {
            d3.select(n[i]).classed("svg-blur", true)
        });
        this._groupsNode.each((d,i,n) => {
            d3.select(n[i]).classed("svg-blur", true)
        });

        this._linksNode.classed("svg-blur", true)
        d3.select(e.currentTarget)
            .attr("opacity", "1")
            .classed("svg-blur", false)
            .attr("id", "node-active");

        const top_g = this._rootG
            .insert("g", "#node-active")
            .attr("id", "top-container");

        const activeLink = this._linksNode
            .filter((d) => d.source.data.id == data.data.id)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", 3)
            .classed("svg-blur", false)
            .attr("id", (_, i, node) => {
                return "link-active-" + i;
            });

        activeLink.each((l, i, node) => {
            top_g.append("use").attr("xlink:href", "#link-active-" + i);
        });
        const activeGroup = this._groupsNode
            .filter((d) => data.data.groups.includes(d.data.id))
            
        activeGroup.each((l, i, node) => {
            d3.select(node[i]).classed("svg-blur", false).attr("id", (_, i) => "group-active-" + i);
            top_g.append("use").attr("xlink:href", "#group-active-" + i);
        });
    }
    _leafMouseOut(d, i) {
        // groups.attr("fill", d => d.data.color)
        // circles.attr("fill", d => d.data.color)
        this._leaves.each((d,i,n) => {
            d3.select(n[i]).classed("svg-blur", false).attr("id", null);
        });
        this._groupsNode.each((d,i,n) => {
            d3.select(n[i]).classed("svg-blur", false).attr("id", null);
        });
        this._linksNode.attr("stroke-width", 1.1)
            .classed("active", false)
            .classed("svg-blur", false)
            .attr("id", null);
            
        const top = d3.select("g#top-container");
        if (top) {
            top.remove();
        }
    }
    _groupMouseOver(e, data) {
        this._rootSvg.select("g#top-container").remove();
        this._groupsNode.each((d,i,n) => {
            d3.select(n[i]).classed("svg-blur", true)
        });
        this._linksNode.classed("svg-blur", true)

        d3.select(e.currentTarget)
            .classed("svg-blur", false)
            .attr("opacity", "1")
            .attr("id", "node-active");

        const top_g = this._rootG
            .insert("g", "*")
            .attr("id", "top-container");
        const activeLink = this._linksNode
            .filter((e) => e.target.data.id == data.data.id)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", 3)
            .classed("svg-blur", false)
            .attr("id", (_, i, node) => {
                return "link-active-" + i;
            });
        activeLink.each((l, i, node) => {
            top_g.append("use").attr("xlink:href", "#link-active-" + i);
        });
        const activeLeaf = this._leaves
            .filter((d) => d.data.groups.includes(data.data.id))
            .attr("opacity", "1")

        activeLeaf.each((l, i, node) => {
            d3.select(node[i]).attr("id", (_, i) => "leaf-active-" + i);
        });
        this._toggleBlurNotActiveLeaf(activeLeaf);
        activeLink.classed("svg-blur", false);
    }
    _groupMouseOut(d, i) {
        this._toggleBlurNotActiveLeaf(false);
        this._leaves.each((d,i,n) => {
            d3.select(n[i]).attr("opacity", "1").attr("id", null);
        });
        this._groupsNode.each((d,i,n) => {
            d3.select(n[i]).attr("opacity", "1")
            .classed("svg-blur", false)
            .attr("id", null);
        });
            
        this._linksNode
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 1.1)
            .classed("active", false)
            .attr("id", null);
        const top = this._rootSvg.select("g#top-container");
        if (top) {
            top.remove();
        }
    }
    _focusOnGroup(event, data) {
        this._onClickGroup();
        event.stopPropagation();
        this._removeAllMouseEvent();
        this._boundZoomToGroup(this._radius).finally(() => {
            this._clicked = true;
            this._rootSvg.select("#content").on("click", (e) => {
                this._clicked = false;
                e.stopPropagation();
                this._removeAllMouseEvent();
                this._addMouseEvent(this._leaves, group);
                this._leafMouseOut();
                this._groupMouseOut();
                this._rootSvg.select("#content").on("click", null);
            });
        });
    }
    async _boundZoomToGroup(padding = 0) {
        const currentZoom = d3.zoomTransform(this._rootSvg.node());

        this._rootSvg.call(this._zoom.transform, d3.zoomIdentity)
        const bound = this._rootG.node().getBoundingClientRect(); console.log(bound)
        const targetBound = this._rootSvg.select("g#top-container").node().getBoundingClientRect();
        console.log(targetBound)
        this._rootSvg.call(this._zoom.transform, currentZoom);

        const containerBound = this._rootSvg.node().getBoundingClientRect();

        const k1 = isFinite(containerBound.width / bound.width) ? ((containerBound.width - 50) / bound.width): 1;
        const k2 = isFinite(containerBound.height / bound.height) ? ((containerBound.height - 50) / bound.height): 1;
        const k = (k1 > k2 ? k2 : k1);

        const l1 = isFinite(containerBound.width / targetBound.width) ? ((containerBound.width - padding * 2) / targetBound.width): 1;
        const l2 = isFinite(containerBound.height / targetBound.height) ? ((containerBound.height - padding * 2) / targetBound.height): 1;
        const l = (l1 > l2 ? l2 : l1);

        const currentViewBox = this._rootSvg.node().viewBox.baseVal;
        
        //ADAPT TRANSFORMATION INTO VIEWBOX SCOPE
        const wRatio = currentViewBox.width / containerBound.width;
        const hRatio = currentViewBox.height / containerBound.height;

        let tx = Math.abs(containerBound.x - bound.x) * k + (containerBound.width / 2 - (bound.width / 2) * k);
        let ty = Math.abs(containerBound.y - bound.y) * k + (containerBound.height / 2 - (bound.height / 2) * k);
        tx *= wRatio;
        ty *= hRatio;
        tx += currentViewBox.x
        ty += currentViewBox.y

        let ux = (containerBound.x - targetBound.x) * l + (containerBound.width / 2 - (targetBound.width / 2) * l);
        let uy = (containerBound.y - targetBound.y) * l + (containerBound.height / 2 - (targetBound.height / 2) * l);
        ux *= wRatio;
        uy *= hRatio;
        ux += currentViewBox.x
        uy += currentViewBox.y

        return this._rootSvg.transition().duration(750)
        .call(this._zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k))
        .call(this._zoom.transform, d3.zoomIdentity.translate(ux,uy).scale(l))
        .end()
    }
    _toggleBlurNotActiveLeaf(activeLeaf) {
        if (activeLeaf) {
            this._leaves
                .on("click", (e) => e.stopPropagation())
                .each((d,i,n) => {
                   d3.select(n[i]).classed("svg-blur", true)
                });
            activeLeaf.on("click", this._onClickNode)
            activeLeaf.each((l, i, node) => {
                d3.select(node[i]).classed("svg-blur", false);
            });
        } else {
            this._leaves
                .on("click", (e) => e.stopPropagation())
                .each((d,i,n) => {
                   d3.select(n[i]).classed("svg-blur", false)
                });
        }
    }

    _addMouseEvent() {
        this.leaves.on("mouseover", (e, d) => this._leafMouseOver(e, d));
        this.leaves.on("mouseout", (e, d) => this._leafMouseOut(e, d));
        this._groupsNode.on("mouseover", (e, d) => this._groupMouseOver(e, d));
        this._groupsNode.on("mouseout", (e, d) => this._groupMouseOut(e));
        this._groupsNode.on("click", (e, d) => this._focusOnGroup(e, d));
    }
    initZoom = () => {
        const currentZoom = d3.zoomTransform(this._rootSvg.node());

        this._rootSvg.call(this._zoom.transform, d3.zoomIdentity)
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

        let tx = Math.abs(containerBound.x - bound.x) * k + (containerBound.width / 2 - (bound.width / 2) * k);
        let ty = Math.abs(containerBound.y - bound.y) * k + (containerBound.height / 2 - (bound.height / 2) * k);
        tx *= wRatio;
        ty *= hRatio;
        tx += currentViewBox.x
        ty += currentViewBox.y
        return this._rootSvg.transition().call(this._zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k))
    }
}