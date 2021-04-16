const packed = d3.packSiblings(data)
const svg = d3.select("body")
    .append("svg")
    .attr("width", 500)
    .attr("height", 500)
    .attr("viewBox", [-250, -250, 250, 250].join(" "))
    .append("g")
const svg_g = svg
    .selectAll("g")
    .data(packed )
    .enter()
    .append("g")
const svg_circle_parent = svg_g
    .append("circle")
    .attr("r", d => d.r)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("stroke", "#bbb")
    .attr("fill", "white");

