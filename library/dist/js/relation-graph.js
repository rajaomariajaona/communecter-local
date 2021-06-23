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
    constructor(rawData,authorizedTags = null) {
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
        const res = []
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
            res.push({...value, id, groups, label: value.name ? value.name : "", img: value.profilMediumImageUrl})
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
        this._height = GraphUtils.heightByViewportRatio(this._width);
        this._rootSvg
            .attr("viewBox", [-this._width / 2, -this._height / 2,
                this._width,
                this._height,
            ]);
        this._rootG.append("g").attr("id", "links-group");
        this._update();
        this._afterDraw()
    }

    _attachViewBoxResize = () => {
        $(window).resize((e) => {
            this._height = GraphUtils.heightByViewportRatio(this._width);
            this._rootSvg
                .attr("viewBox", [-this._width / 2, -this._height / 2,
                    this._width,
                    this._height,
                ]);
        })
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
            .selectAll("svg")
            .data(this._data, (d) => {
                // return JSON.stringify(d.data)
                return JSON.stringify(d);
            })
            .join((enter) => {
                const nodeSvg = enter.append("svg")
                    .style("overflow", "visible")
                    .style("cursor", "pointer");
                const node = nodeSvg.append("g")
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
                nodeSvg.attr("x", (d) => d.x).attr("y", (d) => d.y);
                const bound = this._rootG.node().getBBox();
                const k = this._width / bound.width;
                if(isFinite(k)){
                    this._rootSvg.call(this._zoom.scaleTo, k);
                }
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
        d3.select("g#top-container").remove();
        this._leaves.each((d,i,n) => {
            d3.select(n[i].parentNode).classed("svg-blur", true)
        });
        this._groupsNode.each((d,i,n) => {
            d3.select(n[i].parentNode).classed("svg-blur", true)
        });

        this._linksNode.classed("svg-blur", true)
        d3.select($(e.currentTarget).closest("svg").get()[0])
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
            d3.select(node[i].parentNode).classed("svg-blur", false).attr("id", (_, i) => "group-active-" + i);
            top_g.append("use").attr("xlink:href", "#group-active-" + i);
        });
    }
    _leafMouseOut(d, i) {
        // groups.attr("fill", d => d.data.color)
        // circles.attr("fill", d => d.data.color)
        this._leaves.each((d,i,n) => {
            d3.select(n[i].parentNode).classed("svg-blur", false).attr("id", null);
        });
        this._groupsNode.each((d,i,n) => {
            d3.select(n[i].parentNode).classed("svg-blur", false).attr("id", null);
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
        d3.select("g#top-container").remove();
        this._groupsNode.each((d,i,n) => {
            d3.select(n[i].parentNode).classed("svg-blur", true)
        });
        this._linksNode.classed("svg-blur", true)

        d3.select($(e.currentTarget).closest("svg").get()[0])
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
            d3.select(node[i].parentNode).attr("id", (_, i) => "leaf-active-" + i);
        });
        this._toggleBlurNotActiveLeaf(activeLeaf);
        activeLink.classed("svg-blur", false);
    }
    _groupMouseOut(d, i) {
        this._toggleBlurNotActiveLeaf(false);
        this._leaves.each((d,i,n) => {
            d3.select(n[i].parentNode).attr("opacity", "1").attr("id", null);
        });
        this._groupsNode.each((d,i,n) => {
            d3.select(n[i].parentNode).attr("opacity", "1")
            .classed("svg-blur", false)
            .attr("id", null);
        });
            
        this._linksNode
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 1.1)
            .classed("active", false)
            .attr("id", null);
        const top = d3.select("g#top-container");
        if (top) {
            top.remove();
        }
    }
    _focusOnGroup(event, data) {
        this._onClickGroup();
        event.stopPropagation();
        this._removeAllMouseEvent();
        const {
            x,
            y,
            width,
            height
        } = d3
            .select("g#top-container")
            .node()
            .getBBox();
        // svg.append("rect")
        //     .attr("x", bound.data.x)
        //     .attr("y", bound.data.y)
        //     .attr("width", bound.data.width)
        //     .attr("height", bound.data.height)
        //     .attr("fill", "none")
        //     .attr("stroke", "red")
        this._boundZoomToGroup(x, y, x + width, y + height, this._radius).finally(() => {
            this._clicked = true;
            d3.select("#content").on("click", (e) => {
                this._clicked = false;
                e.stopPropagation();
                this._removeAllMouseEvent();
                this._addMouseEvent(this._leaves, group);
                this._leafMouseOut();
                this._groupMouseOut();
                d3.select("#content").on("click", null);
            });
        });
    }
    async _boundZoomToGroup(x0, y0, x1, y1, padding = 0) {
        x0 -= padding;
        y0 -= padding;
        x1 += padding * 2;
        y0 += padding * 2;
        return this._rootSvg
            .transition()
            .duration(750)
            .call(
                this._zoom.transform,
                d3.zoomIdentity
                // .translate(width / 2, height / 2)
                .translate(0, 0)
                .scale(
                    isFinite(Math.min(
                        8,
                        0.9 / Math.max((x1 - x0) / this._width, (y1 - y0) / this._height)
                    )) ? Math.min(
                        8,
                        0.9 / Math.max((x1 - x0) / this._width, (y1 - y0) / this._height)
                    ) : 1
                )
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
            )
            .end();
    }
    _toggleBlurNotActiveLeaf(activeLeaf) {
        if (activeLeaf) {
            this._leaves
                .on("click", (e) => e.stopPropagation())
                .each((d,i,n) => {
                   d3.select(n[i].parentNode).classed("svg-blur", true)
                });
            activeLeaf.on("click", this._onClickNode)
            activeLeaf.each((l, i, node) => {
                d3.select(node[i].parentNode).classed("svg-blur", false);
            });
        } else {
            this._leaves
                .on("click", (e) => e.stopPropagation())
                .each((d,i,n) => {
                   d3.select(n[i].parentNode).classed("svg-blur", false)
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
        console.log("INIT ZOOM");
        const bound = this._rootG.node().getBBox();
        const containerBound = this._rootSvg.node().getBoundingClientRect();
        const k = isFinite(containerBound.width / bound.width) ? (containerBound.width / bound.width) - 0.1 : 1;
        console.log( "KKKK", bound, containerBound);
        console.log("KKKK", k);
        this._rootSvg.call(this._zoom.transform, d3.zoomIdentity.scale(k))
    }
}