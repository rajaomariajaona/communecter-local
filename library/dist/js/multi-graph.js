class MultiGraph extends Graph{
    _margin = {top: 100, right: 0, bottom: 0, left: 0};
    _width = 800 - this._margin.left - this._margin.right;
    _height = 800 - this._margin.top - this._margin.bottom;
    _innerRadius = 0
    _outerRadius = Math.min(this._width, this._height) / 2; 
    _maxInternal = 0;
    _maxExternal = 0;
    //Percentage of margin
    _maxInternalMargin = 0.05;
    _secondCircleColor = "#00FF28"
    _exteriorColor = "#FF0014"
    _internalBorderColor = "#ffffff"
    _internalBorderWidth = 1
    _internalCircleRadius = 100
    _secondCircleRadius = 150
    _barplotCircleRadius = 250
    _defaultInternalColor = "#E5E5E5"
    _internalColor = (d,i,n) => {
        return d3.scaleOrdinal([this._defaultInternalColor])(d,i,n)
    };
    _externalColor = d3.scaleOrdinal(d3.schemeSet3)
    constructor(authorizedTags = []){
        super();
        super.setAuthorizedTags(authorizedTags);
    }
    draw(containerId){
        super.draw(containerId);
        this._zoom = d3.zoom().on("zoom", (e) => {
            this._rootG.attr("transform", e.transform);
            this._onZoom(e);
        });
        this._rootSvg.call(this._zoom);
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
        var result = super.preprocessResults(result);
        var data = result;
        if(this._maxInternal <= 0){
            for(const currentInternalData of data.internalData){
                currentInternalData.value = currentInternalData.value.split(";").map((d) => Number(d)).filter(d => !isNaN(d))
                for(const v of currentInternalData.value){
                    if(v > this._maxInternal){
                        this._maxInternal = v
                    }
                }
            }
        }
        if(this._maxExternal <= 0){
            for(const {value} of data.externalData){
                if(value > this._maxExternal){
                    this._maxExternal = value
                }
            }
        }
        this._maxInternal += this._maxInternal * this._maxInternalMargin
        return data;
    }
    setMaxInternal(value){
        this._maxInternal = isNaN(Number(value)) ? this._maxInternal : Number(value);
        this._maxInternal += this._maxInternal * this._maxInternalMargin
    }
    setMaxExternal(value){
        this._maxExternal = isNaN(Number(value)) ? this._maxExternal : Number(value);
    }
    _updateInternal(data){
        var x = d3.scaleBand()
            .range([0, 2 * Math.PI])
            .align(0)
            .domain(data.map(d => d.label));
        //SECOND CIRCLE
        this._rootG.append("g")
        .classed("second-circle", true)
        .append("circle")
        .attr("r", this._secondCircleRadius)
        .attr("fill", this._secondCircleColor)
        .style("filter", "drop-shadow(0px 0px 5px rgb(0 0 0 / 0.2))")

        //CIRCULAR INTERIOR
        //RED PART
        this._rootG.append("circle")
            .classed("circle-red-part", true)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", this._internalCircleRadius)
            .attr("fill", this._exteriorColor)

            
        // DATA PART
        this._rootG.append("g")
            .classed("circle-interior", true)
            .selectAll("g.items")
            .data(data)
            .join((enter) => {
                const mainG = enter.append("g").classed("items", true)
                mainG.each(({label, value, color}) => {
                    const current = label
                    mainG
                        .append("g")
                        .classed("content", true)
                        .selectAll("path")
                        .data(value)
                        .join((pathEnter) => {
                            pathEnter
                                .append("path")
                                .attr("d", d3.arc()
                                .innerRadius(this._innerRadius)
                                .outerRadius((d) => d * this._internalCircleRadius / this._maxInternal)
                                .startAngle(function(d, i) { return x(current) + (x.bandwidth() / value.length) * i; })
                                .endAngle(function(d, i) { return x(current) + (x.bandwidth() / value.length) * (i + 1); })
                                )
                                .attr("fill", color ?? this._internalColor)
                        })
                })
                
                
            })

        //BORDER
        this._rootG.append("g")
        .classed("borders", true)
        .selectAll("g.items")
        .data(data)
        .join((enter) => {
            const mainG = enter.append("g").classed("items", true)
            const line = mainG.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (d) => Math.cos(x(d.label)) * this._internalCircleRadius)
                .attr("y2", (d) => Math.sin(x(d.label)) * this._internalCircleRadius)
                .attr("stroke", this._internalBorderColor)
                .attr("stroke-width", this._internalBorderWidth)
        })
    }
    _updateExternal(data){
        var x = d3.scaleBand()
            .range([0, 2 * Math.PI])
            .align(0)
            .domain(data.map(d => d.label));
        var y = d3.scaleRadial()
            .range([this._secondCircleRadius, this._barplotCircleRadius])
            .domain([0, this._maxExternal]);
        this._rootG.append("g")
            .classed("external", true)
            .selectAll("g.items")
            .data(data)
            .join(enter => {
                const mainG = enter.append("g").classed("items", true)
                mainG.append("path")
                    .attr("fill", this._externalColor)
                    .style("fill", d => d.color)
                    .attr("d", d3.arc()
                        .innerRadius(this._secondCircleRadius)
                        .outerRadius(function(d) { return y(d.value); })
                        .startAngle(function(d) { return x(d.label); })
                        .endAngle(function(d) { return x(d.label) + x.bandwidth(); })
                        .padAngle(0.01)
                        .padRadius(this._secondCircleRadius))
            mainG.append("g")
                .attr("text-anchor", function(d) { return (x(d.label) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
                .attr("transform", function(d) { return "rotate(" + ((x(d.label) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (y(d.value)+10) + ",0)"; })
              .append("text")
                .text(function(d){return(d.label)})
                .attr("transform", function(d) { return (x(d.label) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
                .style("font-size", "9px")
                .attr("alignment-baseline", "middle")
            })
    }
    _update(data){
        this._updateInternal(data.internalData)
        this._updateExternal(data.externalData)
        this.initZoom();
    }
}