function dendo(w, h, svg) {
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const height = h,
        width = w;
    const g = svg
        .attr("height", height)
        .attr("width", width)
        .append("g")
        .attr("transform", "translate(60,20)");
    var experienceName = [
        "",
        "Novice 1.0",
        "Amateur 2.0",
        "Pro 3.0",
        "Expert 4.0",
        "Legende 5.0",
    ];
    var formatSkillPoints = function(d) {
        return experienceName[d % 6];
    };
    var xScale = d3.scaleLinear().domain([0, 5]).range([0, 400]);

    var xAxis = d3.axisTop().scale(xScale).ticks(5).tickFormat(formatSkillPoints);

    // Setting up a way to handle the data
    var tree = d3
        .cluster() // This D3 API method setup the Dendrogram datum position.
        .size([height, width - 520]) // Total width - bar chart width = Dendrogram chart width
        .separation(function separate(a, b) {
            return a.parent == b.parent || // 2 levels tree grouping for category
                a.parent.parent == b.parent ||
                a.parent == b.parent.parent ?
                0.4 :
                0.8;
        });

    const root = d3.hierarchy(data);
    tree(root);
    console.log(root);
    // Draw every datum a line connecting to its parent.
    var link = g
        .selectAll(".link")
        .data(root.descendants().slice(1))
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", function(d) {
            return (
                "M" +
                d.y +
                "," +
                d.x +
                "C" +
                (d.parent.y + 100) +
                "," +
                d.x +
                " " +
                (d.parent.y + 100) +
                "," +
                d.parent.x +
                " " +
                d.parent.y +
                "," +
                d.parent.x
            );
        });

    // Setup position for every datum; Applying different css classes to parents and leafs.
    var node = g
        .selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", function(d) {
            return "node" + (d.children ? " node--internal" : " node--leaf");
        })
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Draw every datum a small circle.
    node.append("circle").attr("r", 4);

    // Setup G for every leaf datum.
    var leafNodeG = g
        .selectAll(".node--leaf")
        .append("g")
        .attr("class", "node--leaf-g")
        .attr("transform", "translate(" + 8 + "," + -13 + ")");

    leafNodeG
        .append("rect")
        .attr("class", "shadow")
        .style("fill", function(d, i) {
            return d.data.color = color(i);
        })
        .attr("width", 2)
        .attr("height", 30)
        .attr("rx", 2)
        .attr("ry", 2)
        .transition()
        .duration(800)
        .attr("width", function(d) {
            return xScale(d.data.value);
        });

    leafNodeG
        .append("text")
        .attr("dy", 19.5)
        .attr("x", 8)
        .style("text-anchor", "start")
        .text(function(d) {
            return d.data.name;
        });

    // Write down text for every parent datum
    var internalNode = g.selectAll(".node--internal");
    internalNode
        .append("text")
        .attr("y", -10)
        .style("text-anchor", "middle")
        .text(function(d) {
            return d.data.name;
        });

    // Attach axis on top of the first leaf datum.
    var firstEndNode = g.select(".node--leaf");
    firstEndNode
        .insert("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(" + 7 + "," + -14 + ")")
        .call(xAxis);

    // tick mark for x-axis
    firstEndNode
        .insert("g")
        .attr("class", "grid")
        .attr("transform", "translate(7," + (height - 15) + ")")
        .call(
            d3
            .axisBottom()
            .scale(xScale)
            .ticks(5)
            .tickSize(-height, 0, 0)
            .tickFormat("")
        );

    // Emphasize the y-axis baseline.
    svg
        .selectAll(".grid")
        .select("line")
        .style("stroke-dasharray", "20,1")
        .style("stroke", "black");

    // The moving ball
    var ballG = svg
        .insert("g")
        .attr("class", "ballG")
        .attr("transform", "translate(" + 1100 + "," + height / 2 + ")");
    ballG
        .insert("circle")
        .attr("class", "shadow")
        .style("fill", "steelblue")
        .attr("r", 5);
    ballG.insert("text").style("text-anchor", "middle").attr("dy", 5).text("0.0");

    // Animation functions for mouse on and off events.
    d3.selectAll(".node--leaf-g")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    function handleMouseOver(event, d, i) {
        var leafG = d3.select(this);

        leafG.select("rect").attr("stroke", "#4D4D4D").attr("stroke-width", "2");

        ballG.each(console.log);
        var ballGMovement = ballG
            .transition()
            .duration(400)
            .attr(
                "transform",
                "translate(" +
                (d.y + xScale(d.data.value) + 90) +
                "," +
                (d.x + 1.5) +
                ")"
            );

        ballGMovement.select("circle").style("fill", d.data.color).attr("r", 18);

        ballGMovement
            .select("text")
            .delay(300)
            .text(Number(d.data.value).toFixed(1));
    }

    function handleMouseOut(event) {
        var leafG = d3.select(this);
        leafG.select("rect").attr("stroke-width", "0");
    }
}