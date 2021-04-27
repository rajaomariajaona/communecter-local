function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const width = 800,
    height = width;
const homeRadius = 130;
const menuRadius = 100;
const homeMargin = 20;
const imageSize = 100;
const dxFromCircleMenu = 1000,
    dyFromCircleMenu = dxFromCircleMenu;

const menuData = [{
    domaine: "Sciences Sociales",
}, {
    domaine: "Sciences technologiques",
}, ];

const root_svg = d3
    .select("svg#graph")
    // .attr("width", width)
    // .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);
const svg = root_svg.append("g");
const zoom = d3
    .zoom()
    .filter((e) => false)
    .on("zoom", (e) => {
        svg.attr("transform", e.transform);
    });
root_svg.call(zoom);
const cx = width / 2;
const cy = height / 2;
const home_group = svg.append("svg").attr("id", "home-svg").append("g");
const home = home_group.append("g");
const g = home_group.append("g");
const home_circle = home
    .append("circle")
    .classed("home-circle", true)
    .attr("r", homeRadius)
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("fill", "#455a64");
const home_svg = home
    .append("svg")
    .style("overflow", "visible")
    .attr("x", (d) => cx - homeRadius * Math.cos(Math.PI / 4))
    .attr("y", (d) => cy - homeRadius * Math.sin(Math.PI / 4))
    .attr("width", (d) => homeRadius * Math.cos(Math.PI / 4) * 2)
    .attr("height", (d) => homeRadius * Math.sin(Math.PI / 4) * 2);
const home_g = home_svg.append("g");
const home_foreign = home_g
    .append("foreignObject")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", homeRadius * Math.cos(Math.PI / 4) * 2)
    .attr("height", homeRadius * Math.sin(Math.PI / 4) * 2);
const home_body = home_foreign
    .append("xhtml:div")
    .style("postion", "relative")
    .style("height", "100%")
    .classed("overflow", true);
const home_title = home_body
    .append("xhmtl:div")
    .style("position", "absolute")
    .style("top", "50%")
    .style("left", "50%")
    .style("color", "white")
    .style("font-size", "2.5rem")
    .style("transform", "translate(-50%,-50%)")
    .text(`Domaines`);
const position = d3
    .scaleLinear()
    .domain([0, menuData.length])
    .range([0, Math.PI * 2]);
const color = d3.scaleOrdinal(d3.schemePastel2);
const menu = g
    .selectAll("g")
    .data(menuData)
    .enter()
    .append("g")
    .classed("menu-home", true);
menu.each((d, i) => {
    d.cos = Math.cos(position(i));
    d.sin = Math.sin(position(i));
    d.cx = cx - (homeRadius + menuRadius + homeMargin) * d.cos;
    d.cy = cy - (homeRadius + menuRadius + homeMargin) * d.sin;
    d.dx =
        cx - (homeRadius + menuRadius + homeMargin + width) * d.cos - width / 2;
    d.dy =
        cy - (homeRadius + menuRadius + homeMargin + height) * d.sin - height / 2;
});

const menu_circle = menu
    .append("foreignObject")
    .classed("menu-circle", true)
    .attr("x", (d, i) => d.cx - menuRadius)
    .attr("y", (d, i) => d.cy - menuRadius)
    .attr("width", (d, i) => menuRadius * 2)
    .attr("height", (d, i) => menuRadius * 2)
    .append("xhtml:div")
    .classed("circle", true)
    .append("xhtml:div")
    .classed("circle-inner", true)
    .append("xhtml:div")
    .classed("circle-wrapper", true)
    .append("xhtml:div")
    .classed("circle-content", true)
    .text((d) => d.domaine);

menu.on("mouseover", function(e) {
    d3.select(this).style("transform", "scale(1.1)");
});
menu.on("mouseout", function(e) {
    d3.select(this).style("transform", "scale(1)");
});
menu.on("click", (e, d) => zoomTo(d));

function parseTransform(a) {
    var b = {};
    for (var i in (a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g))) {
        var c = a[i].match(/[\w\.\-]+/g);
        b[c.shift()] = c;
    }
    return b;
}
var menuZoom = false;
var homeZoom = d3.zoom().on("zoom", (e) => {
    home_group.attr("transform", e.transform);
});
d3.select("svg#graph").call(homeZoom);

function zoomTo(d) {
    homeZoom.filter((e) => false);
    const toZoom = d3.select("#" + d.id);
    const toZoomG = toZoom.select("svg").select("g");
    menuZoom = d3.zoom().on("zoom", (e) => {
        toZoomG.attr("transform", e.transform);
    });
    const transform = toZoomG.attr("transform");
    if (!transform) {
        d3.select("svg#graph")
            .call(menuZoom)
            .call(menuZoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
    } else {
        const t = parseTransform(transform);
        d3.select("svg#graph")
            .call(menuZoom)
            .call(
                menuZoom.transform,
                d3.zoomIdentity.translate(...t.translate).scale(...t.scale)
            );
    }
    const x0 = d.dx,
        y0 = d.dy,
        x1 = d.dx + width,
        y1 = d.dy + height;
    svg
        .transition()
        .duration(750)
        .call(
            zoom.transform,
            d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(8, 1 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
        );
    d3.select("#btn-retour").style("display", "block");
}

function reset() {
    if (menuZoom) {
        menuZoom.on("zoom", null);
    }
    homeZoom.filter((e) => true);

    const transform = home_group.attr("transform");
    if (!transform) {
        d3.select("svg#graph")
            .call(homeZoom)
            .call(homeZoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
    } else {
        const t = parseTransform(transform);
        d3.select("svg#graph")
            .call(homeZoom)
            .call(
                homeZoom.transform,
                d3.zoomIdentity.translate(...t.translate).scale(...t.scale)
            );
    }
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    d3.select("#btn-retour").style("display", "none");
}

const g_menu_content = svg
    .append("g")
    .attr("id", "menu-content")
    .selectAll("g")
    .data(menuData)
    .enter()
    .append("g")
    .attr("id", (d) => (d.id = generateId()));
const svg_menu_content = g_menu_content
    .append("svg")
    .attr("x", (d) => d.dx)
    .attr("y", (d) => d.dy)
    .attr("width", width)
    .attr("height", height)
    .append("g");
d3.select("#btn-retour").on("click", (e) => {
    reset();
});