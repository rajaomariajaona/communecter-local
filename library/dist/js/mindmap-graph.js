class MindmapGraph extends Graph {
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
    _collapsed = [];

    _source = null;
    _i = 0;

    _nodes = [];
    _links = [];
    _treemap = null;

    constructor(data) {
        super()
        this._data = this.preprocessData(data);
    }
    preprocessData(rawData) {
        rawData = d3.hierarchy(rawData);
        this._width = this._width - this._margin.left - this._margin.right;
        this._height = this._height - this._margin.top - this._margin.bottom;
        rawData.x0 = this._height / 2
        rawData.y0 = 0

        this._source = rawData;

        this._treemap = d3
            .tree()
            .size([this._height, this._width])
            .nodeSize([50, 180])
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
        this._afterDraw()
        super.draw(containerId)
        this._rootSvg
            .attr("width", this._width + this._margin.right + this._margin.left)
            .attr("height", this._height + this._margin.top + this._margin.bottom);
        this._rootG = this._rootSvg.append("g")
            .style("transform-box", "fill-box")
            .attr(
                "transform",
                "translate(" + this._margin.left + "," + (this._margin.top + this._height / 2) + ")"
            );
        this.update(this._data);
        this._afterDraw()
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
    updateData(data) {
        this._nodes
        this._data = this.preprocessData(data);
        const tmp = this._duration;
        this._duration = 0
        this.update(this._data)
        this._duration = tmp;
    }
    update(data) {
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
                const texts = node_g
                    .append("text")
                    .text((d) => d.data.name)
                    .attr("x", this._nodePadding.left)
                    .attr("text-anchor", "start")
                    .style("fill", "#455a64");
                node_g.each((d, i, n) => {
                    const {
                        width,
                        height,
                        x,
                        y
                    } = n[i].getBBox();
                    const rectNode = d3
                        .select(n[i])
                        .insert("foreignObject", "text")
                        .attr("x", x - this._nodePadding.left)
                        .attr("y", y - this._nodePadding.top)
                        .attr("width", (d) =>
                            (d.w =
                                width + this._nodePadding.left + this._nodePadding.right)
                        )
                        .attr(
                            "height",
                            (d) =>
                            (d.h = height + this._nodePadding.top + this._nodePadding.bottom)
                        )

                    const rect = rectNode.append("xhtml:div")
                        .style("height", "100%")
                        .style("width", "100%")
                        .style("border-radius", "10px")
                        .style("background-color", (d, i, n) => this._color(d, d.depth, n));
                    this._colored.push(rect)
                });
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
    _click(e, d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
            this._collapsed.push(d.data.id)
        } else {
            d.children = d._children;
            d._children = null;
            this._collapsed = this._collapsed.filter(e => e != d.data.id)
        }
        this._source = d
        this.update(this._data);
    }
}