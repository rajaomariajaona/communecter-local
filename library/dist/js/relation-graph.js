class RelationGraph extends Graph {
    _links = [];
    _data = null;
    _sets = [];
    _defaultColorGroup = d3.scaleOrdinal(d3.schemeCategory10)
    _pathPadding = 30;
    _clicked = false;
    _radius = 50;
    _groupRadius = 100;
    _marginCollide = 35;
    _colorGroup = (d, i, n) => {
        return this._defaultColorGroup(i)
    }
    constructor(data) {
        super()
        this._data = data
        const tmpSets = new Set();
        for (let i = 0; i < this._data.length; i++) {
            const el = this._data[i];
            if (el.set) {
                for (const set of el.set) {
                    tmpSets.add(set)
                    const source = set;
                    const target = el.id
                    this._links.push({
                        source,
                        target
                    })
                }
            }
        }
        this._sets = Array.from(tmpSets);
        for (const id of this._sets) {
            this._data.push({
                id,
                type: "group"
            })

        }
    }

    setOnColorGroup(callback) {
        this._colorGroup = callback;
    }

    draw(containerId) {
        const width = 800,
            height = 800;
        d3.select("#" + containerId).selectAll("svg#graph").remove()
        this._rootSvg = d3.select("#" + containerId)
            .append("svg")
            .attr("id", "graph")
            .attr("viewBox", [-width / 2, -height / 2, width, height])
        this._rootG = this._rootSvg.append("g")

        var simulation = d3.forceSimulation(data)
            .force("link", d3.forceLink(this._links).id(d => d.id).distance(200).strength(1))
            // .force("center", d3.forceCenter().x(width * .5).y(height * .5))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("x", d3.forceX())
            .force("collide", d3.forceCollide().radius(d => (d.type == "group" ? this._groupRadius : this._radius) + this._marginCollide).iterations(2))
            .force("y", d3.forceY())
            .stop();
        const links_node = this._rootG.append("g")
            .selectAll("line")
            .data(this._links)
            .join("line")
            .attr("stroke-width", 1.1)
            .attr("stroke-opacity", 0.3)
            .attr("stroke", "#999")
        const node = this._rootG
            .selectAll("svg")
            .data(data)
            .join("svg")
            .style("overflow", "visible")
        node.each(d => {
            d.x = Math.random() * 200 * data.length;
            d.y = Math.random() * 200 * data.length;
        })
        const group = node.filter(d => d.type && d.type == "group")
        const path = group
            .append("path")
            .attr("stroke", "none")
            .attr("fill", "none")
            .attr("id", (d, i) => `group-${i}`)
            .attr('d', d => `M 0 ${this._groupRadius -this._pathPadding} A 1 1 0 1 1 0 ${-this._groupRadius + this._pathPadding} M 0 ${-this._groupRadius + this._pathPadding} A 1 1 0 1 1 0 ${this._groupRadius - this._pathPadding} `)

        const leaf = node.filter(d => !d.type || d.type != "group")
        leaf.on("click", this._onClickNode)
        var zoom = d3.zoom().on("zoom", (e) => {
            this._rootG.attr("transform", e.transform)
            correctSize()
            if (this._clicked) {
                addMouseEvent(leaf, group);
                this._clicked = false;
            }
        });
        d3.select("svg#graph").call(zoom)
        const groups = group.append("circle")
            .attr("r", this._groupRadius)
            .attr("fill", (d, i) => d.color = this._colorGroup(i));
        const texts_group = group
            .append("text")
            .append("textPath")
            .attr("text-anchor", "middle")
            .style("fill", "white")
            .style("font-size", "30px")
            .attr("startOffset", "50%")
            .attr("xlink:href", (d, i) => `#group-${i}`)
            .text(d => d.id)
        const fontSize = this._groupRadius * (2 / 3);
        const icon_group = group.append("text")
            .attr("font-family", "FontAwesome")
            .style("fill", "white")
            .style("font-size", fontSize + "px")
            .text((d) => String.fromCharCode(Number(`0xf0c0`)))
            .style("cursor", "default")
            .attr("x", 0)
            .attr("y", 0)
            .style("transform", `translate(-${fontSize/2}px, ${fontSize/2}px)`)

        group.on("click", focusOnGroup)

        const images = leaf.append("circle")
            .attr("r", this._radius)
            .attr("fill", (d, i) => d.color = this._color(i));
        leaf
            .filter(d => d.img)
            .append("image")
            .attr("xlink:href", d => d.img)
            .attr("width", d => 80)
            .attr("height", d => 80)
            .attr("transform", d => `translate(-40,-40)`);
        const texts = leaf.filter(d => !d.img)
            .each(d => d.lines = GraphUtils.splitLines(d.label))
            .append("text")
            .attr("transform", d => `scale(${(this._radius - 20)/ GraphUtils.textRadius(d.lines)})`)
            .selectAll("tspan")
            .data(d => d.lines)
            .enter()
            .append("tspan")
            .attr("text-anchor", "middle")
            .attr("x", 0)
            .attr("y", (d, i, n) => (i - n[i].parentNode.__data__.lines.length / 2 + 0.8) * 20)
            .text(d => d.text)
        node.append("title")
            .text(d => d.label);

        // START HOVER EVENT
        const n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
        for (var i = 0; i < n; ++i) {
            simulation.tick();
            ticked()
            if (i == 200) {
                scaleToWidth();
                addMouseEvent(leaf, group);
            }
        }

        function scaleToWidth() {
            const bound = this._rootG.node().getBBox();
            const k = width / bound.width;
            d3.select("svg#graph").call(zoom.scaleBy, k)
        }

        function addMouseEvent(leaf, group) {
            leaf.on('mouseover', leafMouseOver);
            leaf.on('mouseout', e => {
                leafMouseOut();
            });
            group.on('mouseover', groupMouseOver);
            group.on('mouseout', e => {
                groupMouseOut();
            });
            group.on("click", focusOnGroup)
        }

        function removeAllMouseEvent() {
            leaf.on('mouseover', null);
            leaf.on('mouseout', null);
            group.on('mouseover', null);
            group.on('mouseout', null);
            group.on("click", (e) => {
                e.stopPropagation()
            })
        }

        function leafMouseOver(e, data, i) {
            d3.select("g#top-container").remove()
            leaf
                .classed("svg-blur", true);
            group
                .classed("svg-blur", true);

            links_node
                .classed("svg-blur", true);

            d3.select(this)
                .attr('opacity', '1')
                .classed("svg-blur", false)
                .attr("id", "node-active");

            const top_g = this._rootG
                .insert("g", "#node-active")
                .attr("id", "top-container")

            const activeLink = links_node
                .filter(e => e.target.id == data.id)
                .attr("stroke-opacity", 1)
                .attr("stroke-width", 3)
                .classed("svg-blur", false)
                .attr("id", (_, i, node) => {
                    return "link-active-" + i
                })

            activeLink.each((l, i, node) => {
                top_g.append("use")
                    .attr("xlink:href", "#link-active-" + i)
            })
            const activeGroup = group
                .filter(d => data.set.includes(d.id))
                .classed("svg-blur", false)
                .attr("id", (_, i) => "group-active-" + i);

            activeGroup.each((l, i, node) => {
                top_g.append("use")
                    .attr("xlink:href", "#group-active-" + i)
            })
        }

        function leafMouseOut(d, i) {
            // groups.attr("fill", d => d.color)
            // circles.attr("fill", d => d.color)
            leaf
                .classed("svg-blur", false)
                .attr("id", null);
            group
                .classed("svg-blur", false)
                .attr("id", null)

            links_node
                .attr("stroke-width", 1.1)
                .classed("active", false)
                .classed("svg-blur", false)
                .attr("id", null)
            const top = d3.select("g#top-container")
            if (top) {
                top.remove()
            }
        }

        function groupMouseOver(e, data) {
            d3.select("g#top-container").remove()
            group
                .classed("svg-blur", true);
            links_node
                .classed("svg-blur", true);

            d3.select(this)
                .classed("svg-blur", false)
                .attr('opacity', '1')
                .attr("id", "node-active");

            const top_g = this._rootG
                .insert("g", "#node-active")
                .attr("id", "top-container")
            const activeLink = links_node
                .filter(e => e.source.id == data.id)
                .attr("stroke-opacity", 1)
                .attr("stroke-width", 3)
                .classed("svg-blur", false)
                .attr("id", (_, i, node) => {
                    return "link-active-" + i
                })
            activeLink.each((l, i, node) => {
                top_g.append("use")
                    .attr("xlink:href", "#link-active-" + i)
            })
            const activeLeaf = leaf
                .filter(d => d.set.includes(data.id))
                .attr('opacity', '1')
                .attr("id", (_, i) => "leaf-active-" + i);
            activeLeaf.each((l, i, node) => {
                top_g.append("use")
                    .attr("xlink:href", "#leaf-active-" + i)
            })
            toggleBlurNotActiveLeaf(activeLeaf)
            activeLink.classed("svg-blur", false)
        }

        function groupMouseOut(d, i) {
            toggleBlurNotActiveLeaf(false);
            leaf
                .attr('opacity', '1')
                .attr("id", null);
            group
                .attr('opacity', '1')
                .classed("svg-blur", false)
                .attr("id", null)

            links_node
                .attr("stroke-opacity", 0.3)
                .attr("stroke-width", 1.1)
                .classed("active", false)
                .attr("id", null)
            const top = d3.select("g#top-container")
            if (top) {
                top.remove()
            }
        }

        function ticked() {
            links_node
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

        function focusOnGroup(event, data) {
            tooltip.hide()
            event.stopPropagation();
            removeAllMouseEvent()
            const {
                x,
                y,
                width,
                height
            } = d3.select("g#top-container").node().getBBox();
            // svg.append("rect")
            //     .attr("x", bound.x)
            //     .attr("y", bound.y)
            //     .attr("width", bound.width)
            //     .attr("height", bound.height)
            //     .attr("fill", "none")
            //     .attr("stroke", "red")
            boundZoomToGroup(x, y, x + width, y + height).finally(() => {
                this._clicked = true;
                d3.select("#content").on("click", (e) => {
                    this._clicked = false;
                    e.stopPropagation();
                    console.log("HERE")
                    removeAllMouseEvent()
                    addMouseEvent(leaf, group);
                    leafMouseOut();
                    groupMouseOut();
                    d3.select("#content").on("click", null)
                })
            });

        }

        async function boundZoomToGroup(x0, y0, x1, y1) {
            return d3.select("svg").transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
                // .translate(width / 2, height / 2)
                .translate(0, 0)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, d3.select("svg").node()),
            ).end();
        }

        function toggleBlurNotActiveLeaf(activeLeaf) {
            if (activeLeaf) {
                leaf
                    .on("click", (e) => e.stopPropagation())
                    .classed("svg-blur", true);
                activeLeaf
                    .on("click", this._onClickNode)
                    .classed("svg-blur", false);
            } else {
                leaf
                    .on("click", this._onClickNode)
                    .classed("svg-blur", false);
            }
        }
    }
}