class RadialGraph extends Graph{
    _margin = {top: 100, right: 0, bottom: 0, left: 0};
    _width = 800 - this._margin.left - this._margin.right;
    _height = 800 - this._margin.top - this._margin.bottom;
    _radius = Math.min(this._width, this._height) / 2; 
    _labelFontSize = 10
    _levels = 3			//How many levels or inner circles should there be drawn
	_maxValue = 0 			//What is the value that the biggest circle will represent
	_labelFactor = 1.25 	//How much farther than the radius of the outer circle should the labels be placed
	_wrapWidth = 60 		//The number of pixels after which a label needs to be given a new line
	_opacityArea = 0.35 	//The opacity of the area of the blob
	_dotRadius = 4 			//The size of the colored circles of each blog
	_opacityCircles = 0.1 	//The opacity of the circles of each blob
	_strokeWidth = 2 		//The width of the stroke around each blob
	_roundStrokes = false	//If true the area and stroke will follow a round path (cardinal-closed)
	_color = null

    constructor(authorizedTags = []){
        super();
        super.setAuthorizedTags(authorizedTags);
    }
    draw(containerId){
        this._color = this._defaultColor
        super.draw(containerId);
        this._zoom = d3.zoom().on("zoom", (e) => {
            this._rootG.attr("transform", e.transform);
            this._onZoom(e);
        });
        this._rootSvg.call(this._zoom);
        this._addSVGFilters()
    }
    initZoom = () => { 
        if(!this._rootSvg) return;
        const currentZoom = d3.zoomTransform(this._rootSvg.node());

        this._rootSvg.call(this._zoom.transform, d3.zoomIdentity);
        const bound = this._rootG.node().getBoundingClientRect();
        this._rootSvg.call(this._zoom.transform, currentZoom);
        
        const containerBound = this._rootSvg.node().getBoundingClientRect();
        
        const k1 = isFinite(containerBound.width / bound.width) ? ((containerBound.width - 50) / bound.width): 1;
        const k2 = isFinite(containerBound.height / bound.height) ? ((containerBound.height - 50) / bound.height): 1;
        const k = (k1 > k2 ? k2 : k1);
        
        const currentViewBox = this._rootSvg.node().viewBox.baseVal;

        const wRatio = currentViewBox.width / containerBound.width;
        const hRatio = currentViewBox.height / containerBound.height;
        let tx = (containerBound.width / 2) - (bound.width / 2) * k + Math.abs(containerBound.x - bound.x) * k ;
        let ty = (containerBound.height / 2) - (bound.height / 2) * k + Math.abs(containerBound.y - bound.y) * k ;
        tx *= wRatio;
        ty *= hRatio;

        this._rootSvg.transition().call(this._zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k,k))
    }
    preprocessResults(result){
        // var result = super.preprocessResults(result);
        // var data = result;
        // if(this._maxInternal <= 0){
        //     for(const currentInternalData of data.internalData){
        //         currentInternalData.value = (currentInternalData.value ?? "").split(";").map((d) => Number(d)).filter(d => !isNaN(d))
        //         for(const v of currentInternalData.value){
        //             if(v > this._maxInternal){
        //                 this._maxInternal = v
        //             }
        //         }
        //     }
        // }
        // if(this._maxExternal <= 0){
        //     for(const {value} of data.externalData){
        //         if(value > this._maxExternal){
        //             this._maxExternal = value
        //         }
        //     }
        // }
        // this._maxInternal += this._maxInternal * this._maxInternalMargin
        // return data;
        return result;
    }
    _computeMaxValue(){
        this._maxValue = Math.max(this._maxValue, d3.max(data.items, item => d3.max(item.values)));
    }
    _addSVGFilters(){
        //Filter for the outside glow
        let filter = this._rootSvg.append('defs').append('filter').attr('id','glow'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');
    }
    _drawGrid(){
        //Draw the background circles
        this._axisGrid.selectAll(".levels")
            .data(d3.range(1,(this._levels+1)).reverse())
            .enter()
            .append("circle")
            .attr("class", "gridCircle")
            .attr("r", (d, i) => this._radius/this._levels*d)
            .style("fill", "#CDCDCD")
            .style("stroke", "#CDCDCD")
            .style("fill-opacity", this._opacityCircles)
            .style("filter" , "url(#glow)");

        //Text indicating at what % each level is
        this._axisGrid.selectAll(".axisLabel")
            .data(d3.range(1,(this._levels+1)).reverse())
            .enter().append("text")
            .attr("class", "axisLabel")
            .attr("x", 4)
            .attr("y", d=> -d*this._radius/this._levels)
            .attr("dy", "0.4em")
            .style("font-size", "10px")
            .attr("fill", "#737373")
            .text((d,i) => this._maxValue * d/this._levels);
    }
    _drawAxis(allAxis, angleSlice, rScale){
        //Create the straight lines radiating outward from the center
        var axis = this._axisGrid.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");
        //Append the lines
        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => rScale(this._maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2))
            .attr("y2", (d, i) => rScale(this._maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2))
            .attr("class", "line")
            .style("stroke", "white")
            .style("stroke-width", "2px");

        //Append the labels at each axis
        axis.append("text")
            .attr("class", "legend")
            .style("font-size", "11px")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", (d, i) => rScale(this._maxValue * this._labelFactor) * Math.cos(angleSlice*i - Math.PI/2))
            .attr("y", (d, i) => rScale(this._maxValue * this._labelFactor) * Math.sin(angleSlice*i - Math.PI/2))
            .text(function(d){return d})
            .call(GraphUtils.wrap, this._wrapWidth);
    }
    _update(data){
        this._computeMaxValue()
        let allAxis = (data.items.map(function(i, j){return i.name})),	//Names of each axis
            total = allAxis.length,     			//The number of different axes
            Format = d3.format('%'),			 	//Percentage formatting
            angleSlice = Math.PI * 2 / total;
        //Scale for the radius
        const rScale = d3.scaleLinear()
        .range([0, this._radius])
        .domain([0, this._maxValue]);

        //Wrapper for the grid & axes
	    this._axisGrid = this._rootG.append("g").attr("class", "axisWrapper");
        this._drawGrid()
        this._drawAxis(allAxis, angleSlice, rScale)

        //The radial line function
        var radarLine = d3.lineRadial()
            .curve(d3.curveLinearClosed)
            .radius(function(d) { return rScale(d.value); })
            .angle(function(d,i) {	return i*angleSlice; });
            
        if(this._roundStrokes) {
            radarLine.curve(d3.curveCardinalClosed);
        }
                    
        //Create a wrapper for the blobs	
        this._rootG.selectAll(".radarWrapper").remove()
        var blobWrapper = 
            this._rootG.append("g")
            .attr("class", "radarWrapper")        
        //Append the backgrounds
        blobWrapper
            .data(data.items)
            .selectAll("path")
            .enter()
            .append("path")
            .attr("class", "radarArea")
            .attr("d", function(d,i) { console.log(d); return radarLine(d); })
            .style("fill", (d,i) => this._color(i))
            .style("fill-opacity", this._opacityArea)
            .on('mouseover', function (d,i){
                //Dim all blobs
                d3.selectAll(".radarArea")
                    .transition().duration(200)
                    .style("fill-opacity", 0.1); 
                //Bring back the hovered over blob
                d3.select(this)
                    .transition().duration(200)
                    .style("fill-opacity", 0.7);	
            })
            .on('mouseout', function(){
                //Bring back all blobs
                d3.selectAll(".radarArea")
                    .transition().duration(200)
                    .style("fill-opacity", this._opacityArea);
            });
            
        //Create the outlines	
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", function(d,i) { return radarLine(d); })
            .style("stroke-width", this._strokeWidth + "px")
            .style("stroke", (d,i) => this._color(i))
            .style("fill", "none")
            .style("filter" , "url(#glow)");		

        //Append the circles
        blobWrapper.selectAll(".radarCircle")
            .data(function(d,i) { return d; })
            .enter().append("circle")
            .attr("class", "radarCircle")
            .attr("r", this._dotRadius)
            .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
            .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
            .style("fill", (d,i,j) => this._color(j))
            .style("fill-opacity", 0.8);

        /////////////////////////////////////////////////////////
        //////// Append invisible circles for tooltip ///////////
        /////////////////////////////////////////////////////////

        //Wrapper for the invisible circles on top
        var blobCircleWrapper = this._rootG.selectAll(".radarCircleWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarCircleWrapper");
            
        //Append a set of invisible circles on top for the mouseover pop-up
        blobCircleWrapper.selectAll(".radarInvisibleCircle")
            .data(function(d,i) { return d; })
            .enter().append("circle")
            .attr("class", "radarInvisibleCircle")
            .attr("r", this._dotRadius*1.5)
            .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
            .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function(d,i) {
                newX =  parseFloat(d3.select(this).attr('cx')) - 10;
                newY =  parseFloat(d3.select(this).attr('cy')) - 10;
                        
                tooltip
                    .attr('x', newX)
                    .attr('y', newY)
                    .text(Format(d.value))
                    .transition().duration(200)
                    .style('opacity', 1);
            })
            .on("mouseout", function(){
                tooltip.transition().duration(200)
                    .style("opacity", 0);
            });
            
        //Set up the small tooltip for when you hover over a circle
        var tooltip = this._rootG.append("text")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        this.initZoom();
    }
}