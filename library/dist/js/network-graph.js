class NetworkGraph extends Graph {
    _root = {};
    _defaultIcon = "fa fa-home";
    _defaultRootIcon = "fa fa-home";
    _simulation = null;
    _linksNode = null;
    _nodes = null;
    _circlesNode = null;
    _isEmpty = false;
    _funcGroup = d => d.data.group;
    _onTick = () => {}

    setOnTick(callback){
        this._onTick = callback;
    }
    setCircleSize(callback) {
        this._circleSize = callback;
        this._circlesNode.attr("r", (d, e) => this._circleSize(d, e));
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
        console.log(dataByLinks);
        const links = [];
        const groups = [];
        for (const [group, children] of dataByLinks.entries()) {
            groups.push({data: {
                id: group,
                label: group,
                type: "group",
            }});
            links.push({
                target: group,
                source: root.data.id,
            });
            for (const child of children) {
                links.push({
                    source: group,
                    target: child.data.id,
                });
            }
        }
        const res = {
            root,
            nodes: [root, ...groups, ...filteredData],
            links,
            groups,
        };
        console.log(res);
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
                .id((d) => d.data.id)
                .strength((d) => 0.095)
                ).stop();
            }
        return res;
    }
    draw(containerId) {
        super.draw(containerId);
        this._rootG = this._rootSvg.append("g");

        this._rootSvg
            .attr("viewBox", [0, 0, this._width, this._height])
            // .attr("height", this._height)
            // .attr("width", this._width);
        // const rect = this._rootSvg.node().getBoundingClientRect();

        this._rootSvg.call(
            d3.zoom().on("zoom", (e, d) => {
                this._rootG.attr("transform", e.transform);
                this._onZoom(e,d);
            })
        );
        this._update();
    }
    _circleSize(d, i, n) {
        var r = 10;
        if (this._funcGroup(d) == "root" || d.data.type == "group") return 20;
        // if (r > 30)
        //     r = 30;
        return r;
    }
    _update() {
        if(!this._isEmpty){
            this._simulation.restart()
            this._simulation.on("tick", () => this._tickActions());
            console.log(this._data);
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
                    
                    console.log(update);
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
                .selectAll("svg.node")
                .data(this._data.nodes, d => JSON.stringify(d.data))
                .join((enter) => {
                    this._nodes = enter
                    .append("svg")
                    .style("overflow", "visible")
                    .classed("node", true)
                    .on("click", (d, i, n) => this._onClickNode(d, i, n))
                    .call(
                        d3
                        .drag()
                        .on("start", (e, d) => this._dragStart(e, d))
                        .on("drag", (e, d) => this._dragDrag(e, d))
                        .on("end", (e, d) => this._dragEnd(e, d))
                        );
                        this._circlesNode = this._nodes
                        .append("circle")
                        .attr("r", (d, i, n) => {
                            const r = this._circleSize(d, i, n);
                            d.innerSquare = GraphUtils.squareInnerCircle(0, 0, r);
                            return r;
                        })
                        .attr("fill", (d, i, n) => this._color(d, i, n));
                        const foreign = this._nodes
                        .append("foreignObject")
                        .attr("x", (d) => d.innerSquare.x)
                        .attr("y", (d) => d.innerSquare.y)
                        .attr("width", (d) => d.innerSquare.width)
                        .attr("height", (d) => d.innerSquare.height);
                        
                        foreign
                        .filter((d) => d.data.type == "group" || this._funcGroup(d) == "root")
                        .append("xhtml:div")
                        .style("width", "100%")
                        .style("height", "100%")
                        .style("display", "flex")
                        .style("justify-content", "center")
                        .style("align-items", "center")
                        .append("xhtml:i")
                        .style("color", "white")
                        .attr("class", this._defaultIcon);
                        
                        foreign
                        .filter((v, i) => v.img != undefined && v.img.trim() != "")
                        .append("xhtml:img")
                        .attr("src", (d) => d.data.img)
                        .style("width", "100%")
                        .style("height", "100%")
                        .on("click", (e, d) => this._onClickNode(e, d));
                        this._nodes
                        .append("text")
                        .text((d) => d.data.label)
                        .attr("font-size", 20)
                        .attr("x", 15)
                        .attr("y", 4);
                    }, update => {
                        console.log(update);
            },
            exit => exit.remove());
            this._leaves.push(nodes);
        }
    }
        _dragStart(event, d) {
            console.log(!event.active);
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
        d3.selectAll("svg.node")
            // svg_g_g_image
            .attr("x", function(d) {
                return d.x;
            })
            .attr("y", function(d) {
                return d.y;
            });

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
}