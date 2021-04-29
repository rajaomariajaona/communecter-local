function contact(w, h, content) {
    var data = [{
        name: "03448220",
        type: "Fixe",
        icon: "fa-phone"
    }, {
        name: "0344822017",
        type: "Mobile",
        icon: "fa-mobile-alt"
    }, {
        name: "IB 90 Andraivato",
        type: "Adresse",
        icon: "fa-map-marker-alt"
    }, {
        name: "RAJAOMARIA Jaona",
        type: "Facebook",
        icon: "fab fa-facebook-f"
    }, {
        name: "https://jaonarajao maria.netlify.app",
        type: "Site web",
        icon: "fa-globe"
    }]
    var links = [];
    for (const {
            type
        }
        of data) {
        links.push({
            source: "contact",
            target: type
        })
    }
    console.log(links)
    data.push({
        type: "contact",
        name: "contact",
        icon: "fa-address-card"
    })
    console.log(data)

    const width = w,
        height = h;
    const svg = content ? content : d3.select("svg#graph")
        .attr("height", height)
        .attr("width", width)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .append("g")

    var color = d3.scaleOrdinal(d3.schemeCategory10)
        //var color = d3.scaleOrdinal(d3.schemePastel2);

    var simulation = d3.forceSimulation(data)
        .force("link", d3.forceLink(links).id(d => d.type).distance(250).strength(1))
        .force("charge", d3.forceManyBody().strength(-1000))
        .force("x", d3.forceX())
        .force("collide", d3.forceCollide().radius(100).iterations(2))
        .force("y", d3.forceY());

    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 1.1)
        .attr("stroke-opacity", 0.3)
        .attr("stroke", "#999")

    const node = svg
        .selectAll("svg")
        .data(data)
        .join("svg")
        .style("overflow", "visible")

    const leaf = node.filter(d => d.type && d.type != "contact")
    const group = node.filter(d => !(d.type && d.type != "contact"))



    node.append("circle")
        .attr("r", 60)
        .classed("big", true)
        .attr("stroke", (d, i) => color(i))
        .attr("stroke-width", "2px")
        .attr("fill", "white");
    node.append("circle")
        .classed("small", true)
        .attr("r", 50)
        .attr("fill", (d, i) => color(i));

    group.select("circle.small")
        .attr("fill", _ => color(10));
    group.select("circle.big")
        .attr("stroke", _ => color(10));

    node.append("foreignObject")
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
        .style("color", "white")
        .attr("class", d => d.icon.split(" ").length > 1 ? "fa-3x " + d.icon : "fa fa-3x " + d.icon)

    node.append("title")
        .text(d => d.name);
    leaf.append("foreignObject")
        .style("overflow", "visible")
        .attr("x", -50)
        .attr("y", 70)
        .attr("width", 100)
        .attr("height", 100)
        .append("xhtml:div")
        .style("overflow", "visible")
        .style("width", "100%")
        .style("text-align", "center")
        .text(d => d.name)
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
}