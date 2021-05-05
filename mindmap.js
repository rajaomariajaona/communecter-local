var mindmap = {
    treemap: null,
    root: null,
    svg: null,
    i: 0,
    duration: 750,
    nodePadding: {
        top: 5,
        right: 20,
        bottom: 5,
        left: 10
    },
    margin: {
        top: 20,
        right: 180,
        bottom: 30,
        left: 90
    },
    color: d3.scaleOrdinal(d3.schemePastel2),
    height: null,
    width: null,
    mindmap: function(w, h, treeData, isAdmin = false, svgNode = null) {
        if (isAdmin) {
            this.nodePadding.right = this.nodePadding.left;
        }
        this.width = w - this.margin.left - this.margin.right;
        this.height = h - this.margin.top - this.margin.bottom;
        this.svg = this.buildMindMap(this.width, this.height, this.margin, svgNode);

        this.treemap = d3.tree().size([this.height, this.width]).nodeSize([50, 180]).separation((a, b) => {
            if (a.parent == b.parent) return 1.5;
            else return 2;
        })
        this.updateData(treeData)
    },

    updateData: function(treeData) {
        this.root = d3.hierarchy(treeData);
        console.log(treeData);
        this.root.x0 = this.height / 2;
        this.root.y0 = 0;
        this.duration = 0;
        this.update(this.root);
        this.duration = 750;
    },
    buildMindMap: function(width, height, margin, svgNode) {
        svgNode = (svgNode ?
            svgNode :
            d3
            .select("svg#graph")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
        );
        return svgNode.select("g").node() ? svgNode.select("g") : svgNode.append("g")
            .style("transform-box", "fill-box")
            .attr(
                "transform",
                "translate(" + margin.left + "," + (margin.top + height / 2) + ")"
            );
    },
    diagonal: function(s, d) {
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
    },
    update: function(source) {
        var treeData = this.treemap(this.root);
        var nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);
        var node = this.svg.selectAll("g.node").data(nodes, (d) => d.id || (d.id = ++this.i));
        var node_g;
        node.join(
            enter => {
                node_g = enter.append("g")
                    .attr("class", "node")
                    .attr(
                        "transform",
                        (d) => "translate(" + source.y0 + "," + source.x0 + ")"
                    )
                    .on("click", click);
                const texts = node_g
                    .append("text")
                    .text(d => d.data.name)
                    .attr("x", this.nodePadding.left)
                    .attr("text-anchor", "start")
                    .style("fill", "#455a64");
                node_g.each((d, i, n) => {
                    const {
                        width,
                        height,
                        x,
                        y
                    } = n[i].getBBox();
                    d3.select(n[i])

                    // .insert("rect", "text")
                    // .attr("x", x - this.nodePadding.left)
                    // .attr("y", y - this.nodePadding.top)
                    // .attr("width", (d) => (d.w = width + this.nodePadding.left + this.nodePadding.right))
                    // .attr("height", (d) => (d.h = height + this.nodePadding.top + this.nodePadding.bottom))
                    // .attr("rx", 10)
                    // .attr("fill", (d) => this.color(d.depth));
                    .insert("foreignObject", "text")
                        .attr("x", x - this.nodePadding.left)
                        .attr("y", y - this.nodePadding.top)
                        .attr("width", (d) => (d.w = width + this.nodePadding.left + this.nodePadding.right))
                        .attr("height", (d) => (d.h = height + this.nodePadding.top + this.nodePadding.bottom))
                        .append("xhtml:div")
                        .style("height", "100%")
                        .style("width", "100%")
                        .style("border-radius", "10px")
                        .style("background-color", (d) => this.color(d.depth))
                });
            },
            update => {
                node_g
                    .transition()
                    .duration(this.duration)
                    .attr("transform", function(d) {
                        return "translate(" + d.y + "," + d.x + ")";
                    });
                update
                    .transition()
                    .duration(this.duration)
                    .attr("transform", function(d) {
                        return "translate(" + d.y + "," + d.x + ")";
                    });
            },
            exit => {
                console.log(exit.node())
                exit
                    .transition()
                    .duration(this.duration)
                    .attr("transform", function(d) {
                        return "translate(" + source.y + "," + source.x + ")";
                    })
                    .style("opacity", 0)
                    .remove();

                exit.select("text").style("fill-opacity", 1e-6);
            }
        )

        var link = this.svg
            .selectAll("path.link")
            .data(links, (d) => d.id)
            .style("stroke-width", 1);
        var linkEnter
        link.join(
            enter => {
                linkEnter = enter.insert("path", "g")
                    .attr("class", "link")
                    .attr("d", function(d) {
                        var o = {
                            x: source.x0,
                            y: source.y0,
                        };
                        return mindmap.diagonal(o, o);
                    })
                    .style("stroke-width", 1);
            },
            update => {
                linkEnter.transition()
                    .duration(this.duration)
                    .attr("stroke", "#929292")
                    .attr("fill", "none")
                    .attr("d", function(d) {
                        return mindmap.diagonal(d, d.parent);
                    });
                update.transition()
                    .duration(this.duration)
                    .attr("stroke", "#929292")
                    .attr("fill", "none")
                    .attr("d", function(d) {
                        return mindmap.diagonal(d, d.parent);
                    });

            },
            exit => {
                exit.transition()
                    .duration(this.duration)
                    .attr("d", function(d) {
                        var o = {
                            x: source.x,
                            y: source.y,
                        };
                        return mindmap.diagonal(o, o);
                    })
                    .style("stroke-width", 1)
                    .remove();
            }
        )



        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function click(e, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            mindmap.update(d);
        }
    }
}