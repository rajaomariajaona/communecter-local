function timeline() {
    const dataTimeline = [{
        title: "Parcours 0",
        description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eligendi, est repellat nam labore dolor eos odit alias aliquam magnam deserunt asperiores at nisi, quasi facere mollitia ad quo delectus. Blanditiis?",
    }, {
        title: "Parcours 1",
        description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eligendi, est repellat nam labore dolor eos odit alias aliquam magnam deserunt asperiores at nisi, quasi facere mollitia ad quo delectus. Blanditiis?",
    }, {
        title: "Parcours 2",
        description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eligendi, est repellat nam labore dolor eos odit alias aliquam magnam deserunt asperiores at nisi, quasi facere mollitia ad quo delectus. Blanditiis?",
    }, {
        title: "Parcours 3",
        description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eligendi, est repellat nam labore dolor eos odit alias aliquam magnam deserunt asperiores at nisi, quasi facere mollitia ad quo delectus. Blanditiis?",
    }, {
        title: "Parcours 4",
        description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eligendi, est repellat nam labore dolor eos odit alias aliquam magnam deserunt asperiores at nisi, quasi facere mollitia ad quo delectus. Blanditiis?",
    }, {
        title: "Parcours 5",
        description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eligendi, est repellat nam labore dolor eos odit alias aliquam magnam deserunt asperiores at nisi, quasi facere mollitia ad quo delectus. Blanditiis?",
    }, ];

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const foreign = d3
        .select("g#menu-parcours")
        .select("svg")
        .style("overflow", "visible")
        .select("g")
        .append("foreignObject")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("overflow", "visible");
    const container = foreign.append("xhtml:div").classed("container", true);
    const ul_timeline = container
        .append("xhtml:ul")
        .classed("timeline", true)
        .selectAll("li")
        .data(dataTimeline)
        .enter();
    const li_timeline = ul_timeline
        .append("xhtml:li")
        .classed("timeline-inverted", (d, i) => i % 2 == 1);

    li_timeline
        .append("xhtml:div")
        .classed("timeline-badge primary", true)
        .append("xhtml:a")
        .append("xhtml:i")
        .attr("class", "fa fa-dot-circle-o")
        .style("color", (d, i) => (d.color = color(i)));
    const panel_timeline = li_timeline
        .append("xhtml:div")
        .classed("timeline-panel", true);
    const head_timeline = panel_timeline
        .append("xhtml:div")
        .classed("timeline-heading", true);
    head_timeline
        .append("xhtml:h3")
        .style("color", d => d.color)
        .text((d) => d.title);
    const body_timeline = panel_timeline
        .append("xhtml:div")
        .classed("timeline-body", true)
        .append("xhtml:p")
        .text((d) => d.description);
}