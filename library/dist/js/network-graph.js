class NetworkGraph extends Graph {
    _root = {};
    _defaultIcon = "fa fa-home";
    _defaultRootIcon = "fa fa-home";
    _simulation = null;
    _groups = {};
    _linksNode = null;
    _nodes = null;
    _circlesNode = null;

    setCircleSize(callback) {
        this._circleSize = callback;
        this._circlesNode.attr("r", (d, e) => this._circleSize(d, e))
    }

    _color = (d, i, n) => {
        if (d.type == "group") {
            return "#c62f80";
        }
        if (d.group == "root") {
            return "black"
        }
        if (d.group == "TAGS") {
            return "steelblue"
        }
        if (d.group == "PROJECTS") {
            return "purple"
        }
        return this._defaultColor(i);
    };
    constructor(rawData) {
        super();
        const {
            data,
            root,
            links,
            groups
        } = this._preprocessData(rawData);
        this._data = data;
        this._root = root;
        this._groups = groups;
        this._links = links;
    }

    _preprocessData(rawData) {
        const root = rawData.filter((d) => d.group == "root");
        if (root.length != 1) {
            throw new Error("Pas de donnée pour root ou plusieur root");
        }
        const filteredData = rawData.filter((d) => d.group != "root");
        const dataByLinks = d3.group(filteredData, (d) => d.group);
        const links = [];
        const groups = [];
        for (const [group, children] of dataByLinks.entries()) {
            groups.push({
                id: group,
                label: group,
                type: "group",
            });
            links.push({
                target: group,
                source: root[0].id,
            });
            for (const child of children) {
                links.push({
                    source: group,
                    target: child.id,
                });
            }
        }
        return {
            root: root[0],
            data: [...root, ...groups, ...filteredData],
            links,
            groups,
        };
    }
    draw(containerId) {
        super.draw(containerId);
        this._rootG = this._rootSvg.append("g");

        this._rootSvg
            // .attr("viewBox", [0, 0, this._width, this._height])
            .attr("height", this._height)
            .attr("width", this._width);
        // const rect = this._rootSvg.node().getBoundingClientRect();

        this._rootSvg.call(
            d3.zoom().on("zoom", (e, d) => {
                this._rootG.attr("transform", e.transform);
            })
        );

        this._update();
        this._simulation = d3
            .forceSimulation()
            .nodes(this._data)
            .force("charge_force", d3.forceManyBody().strength(-120))
            .force("center_force", d3.forceCenter(this._width / 2, this._height / 2))
            .force(
                "links",
                d3
                .forceLink(this._links)
                .id((d) => d.id)
                .strength((d) => 0.095)
            );
        this._simulation.on("tick", () => this._tickActions());
    }
    _circleSize(d, i, n) {
        var r = 10;
        if (d.group == "root" || d.type == "group") return 20;
        // if (r > 30)
        //     r = 30;
        return r;
    }
    _update() {
        this._rootG
            .append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(this._links)
            .join((enter) => {
                this._linksNode = enter
                    .append("line")
                    .attr("stroke-width", 5)
                    .style("stroke", "rgba(51,51,51,0.6)");
            });
        const nodes = this._rootG
            .append("g")
            .attr("class", "nodes")
            .selectAll("svg.node")
            .data(this._data)
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
                        const r = this._circleSize(d, i, n)
                        d.innerSquare = GraphUtils.squareInnerCircle(0, 0, r);
                        return r
                    })
                    .attr("fill", (d, i, n) => this._color(d, i, n));
                const foreign = this._nodes
                    .append("foreignObject")
                    .attr("x", d => d.innerSquare.x)
                    .attr("y", d => d.innerSquare.y)
                    .attr("width", d => d.innerSquare.width)
                    .attr("height", d => d.innerSquare.height)

                foreign.filter(d => d.type == "group" || d.group == "root")
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
                    .attr("src", (d) => d.img)
                    .style("width", "100%")
                    .style("height", "100%")
                    .on('click', (e, d) => this._onClickNode(e, d))
                this._nodes.append('text')
                    .text(d => d.label)
                    .attr('font-size', 20)
                    .attr('x', 15)
                    .attr('y', 4)
            });
        this._leaves.push(nodes);
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
        // svg_g_g_circle
        //     .attr("cx", function(d) {
        //         return d.x;
        //     })
        //     .attr("cy", function(d) {
        //         return d.y;
        //     });

        this._nodes
            // svg_g_g_image
            .attr("x", function(d) {
                return d.x;
            })
            .attr("y", function(d) {
                return d.y;
            });

        // svg_g_g_text
        //     .attr('x', function(d) {
        //         return d.x
        //     })
        //     .attr('y', function(d) {
        //         return d.y
        //     })
        // svg_g_g_icon
        //     .attr('x', function(d) {
        //         return d.x
        //     })
        //     .attr('y', function(d) {
        //         return d.y
        //     })

        //update link positions
        this._linksNode
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