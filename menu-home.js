const width = 800,
    height = width;
const homeRadius = 200;
const menuRadius = 70;
const homeMargin = 20;
const imageSize = 100;
const dxFromCircleMenu = 1000,
    dyFromCircleMenu = dxFromCircleMenu;

const menuData = [
    { id: "menu-competence", menu: "Mes Competences" },
    { id: "menu-contact", menu: "Me Contacter" },
    { id: "menu-parcours", menu: "Mon Parcours" },
    { id: "menu-projet", menu: "Mes Projets" },
    { id: "menu-collaborateur", menu: "Mes Collaborateurs" },
]

const root_svg = d3.select("svg#graph")
const svg = root_svg
    // .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .append("g");
const zoom = d3.zoom().filter(e => false).on("zoom", (e) => {
    svg.attr("transform", e.transform);
})
root_svg.call(zoom)
const g = svg.append("g");
const cx = width / 2;
const cy = height / 2;
const home = svg.append("g");
const home_circle = home
    .append("circle")
    .classed("home-circle", true)
    .attr("r", homeRadius)
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("fill", "#455a64")
const home_svg = home
    .append("svg")
    .style("overflow", "visible")
    .attr("x", d => cx - (homeRadius) * Math.cos(Math.PI / 4))
    .attr("y", d => cy - (homeRadius) * Math.sin(Math.PI / 4))
    .attr("width", d => (homeRadius) * Math.cos(Math.PI / 4) * 2)
    .attr("height", d => (homeRadius) * Math.sin(Math.PI / 4) * 2)
const home_g = home_svg.append("g")
const home_image = home_g.append("image")
    .attr("xlink:href", "me2.jpg")
    .attr("width", imageSize)
    .attr("height", imageSize)
    .attr("x", d => (homeRadius) * Math.cos(Math.PI / 4))
    .attr("transform", "translate(-50,-10)")
const home_foreign = home_g.append("foreignObject")
    .attr("x", 0)
    .attr("y", imageSize + 20)
    .attr("width", (homeRadius) * Math.cos(Math.PI / 4) * 2)
    .attr("height", (homeRadius) * Math.sin(Math.PI / 4) * 2 - imageSize - 40)
const home_text = home_foreign
    .append("xhtml:div")
    .style("text-align", "justify")
    .style("color", "white")
    .style("height", "90px")
    .classed("overflow", true)
    .text(`Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas tenetur adipisci nihil inventore, cumque illo dolor explicabo odio nisi aut rerum, laborum commodi doloremque doloribus, eveniet excepturi minus neque magni.
    Neque minus quas sed! Exercitationem, ab. Quod ipsum molestiae earum error, iusto inventore optio eius cum tempora nobis officiis commodi voluptate reprehenderit dolore doloribus neque asperiores nesciunt rerum voluptatum ratione!`)
home_foreign.append("xhtml:div")
    .style("padding", "10px")
    .style("text-align", "center")
    .append("xhtml:button")
    .classed("btn", true)
    .text("Voir plus")
const position = d3.scaleLinear()
    .domain([0, menuData.length])
    .range([0, Math.PI * 2]);
const color = d3.scaleOrdinal(d3.schemePastel2)
const menu = g
    .selectAll("g")
    .data(menuData)
    .enter()
    .append("g")
    .classed("menu-cv", true)
menu.each((d, i) => {
    d.cos = Math.cos(position(i));
    d.sin = Math.sin(position(i));
    d.cx = cx - (homeRadius + menuRadius + homeMargin) * d.cos;
    d.cy = cy - (homeRadius + menuRadius + homeMargin) * d.sin;
    d.dx = cx - (homeRadius + menuRadius + homeMargin + width) * d.cos - width / 2
    d.dy = cy - (homeRadius + menuRadius + homeMargin + height) * d.sin - height / 2
})
const menu_circle = menu
    .append("circle")
    .classed("menu-circle", true)
    .attr("cx", (d, i) => d.cx)
    .attr("cy", (d, i) => d.cy)
    .attr("r", menuRadius)
    .attr("fill", (d, i) => color(i))
const menu_texts = menu.append("text")
    .attr("text-anchor", "middle")
    .attr("x", (d, i) => d.cx)
    .attr("y", (d, i) => d.cy)
    .text(d => d.menu)