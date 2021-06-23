class NetworkGraph extends Graph {
    _root = {};
    _defaultIcon = "fa fa-home";
    _defaultRootIcon = "fa fa-home";
    _simulation = null;
    _linksNode = null;
    _nodes = null;
    _circlesNode = null;
    _groupNode = null;
    _isEmpty = false;
    _funcGroup = d => d.data.group;
    _onTick = () => {}
    _groupIcons = () => {
        return this._defaultIcon;
    }

    setGroupIcon(callback){
        this._groupIcons = callback;
        if(this._groupNode){
            this._groupNode.selectAll("i").attr("class", this._groupIcons)
        }
    }

    setOnTick(callback){
        this._onTick = callback;
    }
    setCircleSize(callback) {
        this._circleSize = (d,i,n) => {
            const r = callback(d,i,n);
            this._afterCicleSize(d,r);
            return r;
        };
        if(this._circlesNode){
            this._circlesNode.attr("r",(d,i,n) => this._circleSize(d,i,n));
        }
    }

    _color = (d, i, n) => {
        if (d.data.type == "group") {
            return "#c62f80";
        }
        if (d.data.group == "root") {
            return "black";
        }
        if (d.data.group == "TAGS") {
            return "steelblue";
        }
        if (d.data.group == "PROJECTS") {
            return "purple";
        }
        return this._defaultColor(i);
    };
    constructor(rawData, funcGroup = d => d.data.group) {
        super();
        this._funcGroup = funcGroup;
        this._data = this._preprocessData(rawData);
    }

    preprocessResults(results){
        let countTag = 0;
        let res = [{
            label: "SEARCH",
            type: "root",
            group: "root"
        }]
        for (const [id, value] of Object.entries(results)) {
        const row = {
            id,
            ...value
            }
            row.label = value.name
            row.description = value.description
            row.img = value.profilMediumImageUrl
            res.push(row);
        }
        return res
    }

    _preprocessData(rawData) {
        let rootCount = 0;
        let root = null;
        const filteredData = []
        for (const row of rawData) {
            if(row.group == "root"){
                rootCount++;
                if(rootCount > 1){
                    throw new Error("Pas de donnée pour root ou plusieur root");
                }
                root = {}
                root.data = row;
            }else{
                filteredData.push({data: row})
            }
        }
        const dataByLinks = d3.group(filteredData, this._funcGroup);
        const links = [];
        const groups = [];
        for (const [group, children] of dataByLinks.entries()) {
            groups.push({data: {
                id: group,
                label: group,
                type: "group",
                group: "group",
            }});
            links.push({
                target: group + ".group",
                source: root.data.id + ".root",
            });
            for (const child of children) {
                links.push({
                    source: group + ".group",
                    target: child.data.id + "." + this._funcGroup(child),
                });
            }
        }
        const res = {
            root,
            nodes: [root, ...groups, ...filteredData],
            links,
            groups,
        };
        this._isEmpty = !(res.links.length > 0);
        if(!this._isEmpty){
            this._simulation = d3
            .forceSimulation()
            .nodes(res.nodes)
            .force("charge_force", d3.forceManyBody().strength(-120))
            .force("center_force", d3.forceCenter(this._width / 2, this._height / 2))
            .force(
                "links",
                d3
                .forceLink(res.links)
                .id((d) => d.data.id + "." + this._funcGroup(d))
                .strength((d) => 0.095)
                ).stop();
            }
        return res;
    }
    draw(containerId) {
        super.draw(containerId);
        this._rootSvg
            .attr("viewBox", [0, 0, this._width, this._height])
        this._zoom = d3.zoom().on("zoom", (e, d) => {
            this._rootG.attr("transform", e.transform);
            this._onZoom(e,d);
        })
        this._rootSvg.call(this._zoom);
        this._update();
        this._afterDraw()
    }
    _circleSize(d, i, n) {
        var r = 10;
        if (this._funcGroup(d) == "root" || d.data.type == "group") r = 20;
        // if (r > 30)
        //     r = 30;
        this._afterCicleSize(d,r);
        return r;
    }
    _afterCicleSize(d,r){
        d.innerSquare = GraphUtils.squareInnerCircle(0, 0, r, 5);
        this._nodes
            .selectAll("foreignObject")
            .attr("x", (d) => d.innerSquare.x)
            .attr("y", (d) => d.innerSquare.y)
            .attr("width", (d) => d.innerSquare.width)
            .attr("height", (d) => d.innerSquare.height);
    }
    _update() {
        if(!this._isEmpty){
            this._simulation.restart()
            this._simulation.on("tick", () => this._tickActions());
            if (!this._rootG.select("g.links").node()) {
                this._rootG.append("g").attr("class", "links");
            }
            this._rootG
            .select("g.links")
            .selectAll("line")
            .data(this._data.links, d => d.source.id + " " + d.target.id)
            .join(
                (enter) => {
                    this._linksNode = enter
                    .append("line")
                    .classed("links-line", true)
                    .attr("stroke-width", 5)
                    .style("stroke", "rgba(51,51,51,0.6)");
                },
                (update) => {
                    return update;
                },
                (exit) => {
                    exit.remove();
                }
                );
                if (!this._rootG.select("g.nodes").node()) {
                    this._rootG.append("g").attr("class", "nodes");
                }
                const nodes = this._rootG
                .select("g.nodes")
                .selectAll("g.node")
                .data(this._data.nodes, d => JSON.stringify(d.data))
                .join((enter) => {
                    this._nodes = enter
                        .append("g")
                        .style("overflow", "visible")
                        .style("cursor", "pointer")
                        .classed("node", true)
                    this._nodes.append("g")
                        .on("click", (d, i, n) => this._onClickNode(d, i, n))
                        .on("mouseover", (e,d) => {
                            d3.select(e.currentTarget).select("text").text(this._labelFunc(d))
                        })
                        .on("mouseout", (e,d) => {
                            d3.select(e.currentTarget).select("text").text(d => GraphUtils.truncate(this._labelFunc(d), 20))
                        })
                        .call(
                            d3
                                .drag()
                                .on("start", (e, d) => this._dragStart(e, d))
                                .on("drag", (e, d) => this._dragDrag(e, d))
                                .on("end", (e, d) => this._dragEnd(e, d))
                                );
                        this._circlesNode = this._nodes
                            .select("g")
                            .append("circle")
                            .attr("r", (d,i,n) => this._circleSize(d,i,n))
                            .attr("fill", (d, i, n) => this._color(d, i, n));
                        this._colored.push(this._circlesNode)

                    const foreign = this._nodes
                        .select("g")
                        .append("foreignObject")
                        .attr("x", (d) => d.innerSquare.x)
                        .attr("y", (d) => d.innerSquare.y)
                        .attr("width", (d) => d.innerSquare.width)
                        .attr("height", (d) => d.innerSquare.height);
                    const group = foreign
                        .filter((d) => d.data.type == "group" || this._funcGroup(d) == "root")
                        .append("xhtml:div")
                        .style("width", "100%")
                        .style("height", "100%")
                        .style("display", "flex")
                        .style("justify-content", "center")
                        .style("align-items", "center")
                    this._groupNode = group;
                    group.append("xhtml:i")
                        .style("color", "white")
                        .attr("class", this._groupIcons);
                        
                    foreign
                        .filter((d, i) => d.data.img != undefined && d.data.img.trim() != "")
                        .append("xhtml:img")
                        .attr("src", (d) => d.data.img)
                        .style("width", "100%")
                        .style("height", "100%")
                        .on("click", (e, d) => this._onClickNode(e, d));
                    this._nodes
                        .select("g")
                        .append("text")
                        .text((d) => GraphUtils.truncate(this._labelFunc(d), 20))
                        .attr("font-size", 20)
                        .attr("x", 15)
                        .attr("y", 4);
                    }, update => {
            },
            exit => exit.remove());
            this._leaves.push(nodes);
        }
    }
        _dragStart(event, d) {
            if (!event.active) this._simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
    }
    
    _dragDrag(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    _dragEnd(event, d) {
        if (!event.active) this._simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    _tickActions() {
        this._onTick()
        d3.selectAll("g.node")
        .attr("transform", d=> `translate(${d.x}, ${d.y})`);

        //update link positions
        d3.selectAll(".links-line")
            .attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });
    }
    initZoom = () => {
        const currentZoom = d3.zoomTransform(this._rootSvg.node());

        this._rootSvg.call(this._zoom.transform, d3.zoomIdentity)
        const bound = this._rootG.node().getBoundingClientRect();
        this._rootSvg.call(this._zoom.transform, currentZoom);

        const containerBound = this._rootSvg.node().getBoundingClientRect();

        const k1 = isFinite(containerBound.width / bound.width) ? ((containerBound.width - 50) / bound.width): 1;
        const k2 = isFinite(containerBound.height / bound.height) ? ((containerBound.height - 50) / bound.height): 1;
        const k = (k1 > k2 ? k2 : k1);

        this._rootSvg.transition().call(this._zoom.transform, d3.zoomIdentity.translate(containerBound.width / 2 - (bound.width / 2) * k, containerBound.height / 2 - (bound.height / 2) * k).scale(k))
    }
}