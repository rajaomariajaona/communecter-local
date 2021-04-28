function mindmap(w, h, svgNode = null) {
    const nodePadding = {
        x: 10,
        y: 5,
    };
    var margin = {
            top: 20,
            right: 180,
            bottom: 30,
            left: 90,
        },
        width = w - margin.left - margin.right,
        height = h - margin.top - margin.bottom;
    var svg = (svgNode ?
            svgNode :
            d3
            .select("svg#graph")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
        )
        .append("g")
        .style("transform-box", "fill-box")
        .attr(
            "transform",
            "translate(" + margin.left + "," + (margin.top + height / 2) + ")"
        );

    var i = 0,
        duration = 750,
        root;

    // declares a tree layout and assigns the size
    var treemap = d3.tree().size([height, width]).nodeSize([50, 200]);

    // Assigns parent, children, height, depth
    root = d3.hierarchy(treeData);
    root.x0 = height / 2;
    root.y0 = 0;

    const color = d3.scaleOrdinal(d3.schemePastel2);
    // Collapse after the second level
    root.children.forEach((d) => d.children.forEach(collapse));

    update(root);

    // Collapse the node and all it's children
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function update(source) {
        var treeData = treemap(root);
        var nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);
        var node = svg.selectAll("g.node").data(nodes, (d) => d.id || (d.id = ++i));
        var node_g = node
            .enter()
            .append("g")
            .attr("class", "node")
            .attr(
                "transform",
                (d) => "translate(" + source.y0 + "," + source.x0 + ")"
            )
            .on("click", click);

        const texts = node_g
            .append("text")
            .attr("dy", ".35em")
            .attr("x", nodePadding.x)
            .attr("text-anchor", "start")
            .text((d) => d.data.name)
            .style("fill", "#455a64");

        node_g.each((d, i, n) => {
            const {
                width,
                height,
                x,
                y
            } = n[i].getBBox();
            d3.select(n[i])
                .insert("rect", "text")
                .attr("x", x - nodePadding.x)
                .attr("y", y - nodePadding.y)
                .attr("width", (d) => (d.w = width + nodePadding.x * 2))
                .attr("height", (d) => (d.h = height + nodePadding.y * 2))
                .attr("rx", 10)
                .attr("fill", (d) => color(d.depth));
        });

        var nodeUpdate = node_g.merge(node);

        nodeUpdate
            .transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        var nodeExit = node
            .exit()
            .transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("text").style("fill-opacity", 1e-6);

        var link = svg
            .selectAll("path.link")
            .data(links, (d) => {
                console.log(d.id);
                return d.id;
            })
            .style("stroke-width", 1);

        var linkEnter = link
            .enter()
            .insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0,
                };
                return diagonal(o, o);
            })
            .style("stroke-width", 1);

        var linkUpdate = linkEnter.merge(link);

        linkUpdate
            .transition()
            .duration(duration)
            .attr("stroke", "#929292")
            .attr("fill", "none")
            .attr("d", function(d) {
                return diagonal(d, d.parent);
            });

        // Remove any exiting links
        var linkExit = link
            .exit()
            .transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y,
                };
                return diagonal(o, o);
            })
            .style("stroke-width", 1)
            .remove();

        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function diagonal(s, d) {
            if (s != d) {
                sy = s.y;
                dy = d.y;
                dy += d.w;
                path = `M ${sy} ${s.x}
                C ${(sy + dy) / 2} ${s.x},
                ${(sy + dy) / 2} ${d.x},
                ${dy} ${d.x}`;
            } else {
                console.log("here");
                path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;
            }
            return path;
        }

        // Toggle children on click.
        function click(e, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }
    }
}