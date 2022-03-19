const MIN = 30;
function deuxCercles(x,y,r) {
    if(r > MIN){
        let newR = r/2; 
        let newX = x - newR;
        let newX2 = x + newR;
        setTimeout(() => deuxCercles(newX, y, newR), 800)
        setTimeout(() => deuxCercles(newX2, y, newR), 800)
        setTimeout(() => printCercle(x,y,r), 800)
    }
}
troisCercles(400,400, 300);

function printCercle(x,y,r) {
    // const svg = document.querySelector("svg");
    // svg.innerHTML += `<circle style="fill:none;stroke:red;" cx="${x}" cy="${y}" r="${r}"></circle>`
    d3.select("svg")
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .style("fill", "none")
        .style("stroke", "red")
        .attr("r", r)
}

function troisCercles(x,y,r) {
    if(r > MIN){
        printCercle (x, y, r);
        const pr = (0.4641*r);
        const h = r - pr;
        troisCercles (x-h,y,pr);
        troisCercles (x+h/2, y+pr, pr);
        troisCercles (x+h/2, y-pr, pr);
        const svg = d3.select("svg")
        svg.append("line")
            .attr("x1", x-h)
            .attr("y1", y)
            .attr("x2", x+h/2)
            .attr("y2", y+pr)
            .style("stroke", "black")
        svg.append("line")
            .attr("x1", x-h)
            .attr("y1", y)
            .attr("x2", x+h/2)
            .attr("y2", y-pr)
            .style("stroke", "black")
        svg.append("line")
            .attr("x1", x+h/2)
            .attr("y1", y+pr)
            .attr("x2", x+h/2)
            .attr("y2", y-pr)
            .style("stroke", "black")
    }
}
