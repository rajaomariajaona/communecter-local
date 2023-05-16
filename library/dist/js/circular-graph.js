class CircularGraph extends Graph{
    _margin = {top: 100, right: 0, bottom: 0, left: 0};
    _width = 800 - this._margin.left - this._margin.right;
    _height = 800 - this._margin.top - this._margin.bottom;
    _innerRadius = 0
    _outerRadius = Math.min(this._width, this._height) / 2; 
    _max = 0;
    _exteriorColor = "#FF0014"
    _internalBorderColor = "#ffffff"
    _internalBorderWidth = 1
    _internalCircleRadius = 100
    _defaultColor = d3.scaleOrdinal([
        "#E5E5E5"
    ]);
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
        var data = result.internalData;
        var maxCount = 0;
        // for (const [id,row] of Object.entries(result)) {
        //     if(row.tags){
        //         for(const tag of row.tags){
        //             if(this._authorizedTags && Array.isArray(this._authorizedTags) && this._authorizedTags.length > 0){
        //                 if(this._authorizedTags.includes(tag)){
        //                     if(!Object.keys(data).includes(tag)){
        //                         data[tag] = 0;
        //                     }
        //                     data[tag]++;
        //                     if(maxCount < data[tag]){
        //                         maxCount = data[tag];
        //                     }
        //                 }
        //             }else{
        //                 if(!Object.keys(data).includes(tag)){
        //                     data[tag] = 0;
        //                 }
        //                 data[tag]++;
        //                 if(maxCount < data[tag]){
        //                     maxCount = data[tag];
        //                 }
        //             }
        //         }
        //     }
        // }
        // if(this._max > 0 && this._max < Object.keys(data).length){
        //     const entries = Object.entries(data);
        //     entries.sort((a,b) => b[1] - a[1]);
        //     const cleanedData = {}
        //     for (let i = 0; i < this._max; i++) {
        //         cleanedData[entries[i][0]] = entries[i][1]
        //     }
        //     data = cleanedData;
        // }
        if(this._max <= 0){
            for(const [index, values] of Object.entries(data)){
                for(const value of values){
                    if(value > this._max){
                        this._max = value
                    }
                }
            }
        }
        return data;
    }
    setMax(value){
        this._max = isNaN(Number(value)) ? this._max : Number(value);
    }
    _update(data){
        var x = d3.scaleBand()
            .range([0, 2 * Math.PI])
            .align(0)
            .domain(Object.keys(data));
        var y = d3.scaleRadial()
            .range([this._innerRadius, this._outerRadius])
            .domain([0, this._internalCircleRadius]);

        //CIRCULAR INTERIOR
        //RED PART
        this._rootG.append("circle")
            .attr("id", "circle-red-part")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", this._internalCircleRadius)
            .attr("fill", this._exteriorColor)
        // DATA PART
        this._rootG.append("g")
            .attr("id", "circle-interior")
            .selectAll("g.items")
            .data(Object.entries(data))
            .join((enter) => {
                const mainG = enter.append("g").classed("items", true)
                mainG.each(([current, values]) => {
                    console.log(values)
                    mainG
                        .append("g")
                        .classed("content", true)
                        .selectAll("path")
                        .data(values)
                        .join((pathEnter) => {
                            pathEnter
                                .append("path")
                                .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                                .innerRadius(this._innerRadius)
                                .outerRadius((d) => d * this._internalCircleRadius / this._max)
                                .startAngle(function(d, i) { return x(current) + (x.bandwidth() / values.length) * i; })
                                .endAngle(function(d, i) { return x(current) + (x.bandwidth() / values.length) * (i + 1); })
                                )
                                .attr("fill", this._defaultColor)
                        })
                })
                
                
            })

        //BORDER
        this._rootG.append("g")
        .attr("id", "borders")
        .selectAll("g.items")
        .data(Object.entries(data))
        .join((enter) => {
            const mainG = enter.append("g").classed("items", true)
            const line = mainG.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (d) => Math.cos(x(d[0])) * this._internalCircleRadius)
                .attr("y2", (d) => Math.sin(x(d[0])) * this._internalCircleRadius)
                .attr("stroke", this._internalBorderColor)
                .attr("stroke-width", this._internalBorderWidth)
        })



        this.initZoom();
    }
}