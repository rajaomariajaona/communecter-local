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
    var treemap = d3.tree().size([height, width]).nodeSize([50, 180]).separation((a, b) => {
        if (a.parent == b.parent) return 1.5;
        else return 2;
    })

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
                    .attr("x", nodePadding.x)
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
                        .insert("rect", "text")
                        .attr("x", x - nodePadding.x)
                        .attr("y", y - nodePadding.y)
                        .attr("width", (d) => (d.w = width + nodePadding.x * 2))
                        .attr("height", (d) => (d.h = height + nodePadding.y * 2))
                        .attr("rx", 10)
                        .attr("fill", (d) => color(d.depth));
                });
            },
            update => {
                node_g
                    .transition()
                    .duration(duration)
                    .attr("transform", function(d) {
                        return "translate(" + d.y + "," + d.x + ")";
                    });
                update
                    .transition()
                    .duration(duration)
                    .attr("transform", function(d) {
                        return "translate(" + d.y + "," + d.x + ")";
                    });
            },
            exit => {
                console.log(exit.node())
                exit
                    .transition()
                    .duration(duration)
                    .attr("transform", function(d) {
                        return "translate(" + source.y + "," + source.x + ")";
                    })
                    .remove();

                exit.select("text").style("fill-opacity", 1e-6);
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
            update(d);
        }
    }
}