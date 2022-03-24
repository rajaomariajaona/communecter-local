class CircularBarplotGraph extends Graph{
    _margin = {top: 100, right: 0, bottom: 0, left: 0};
    _width = 800 - this._margin.left - this._margin.right;
    _height = 800 - this._margin.top - this._margin.bottom;
    _innerRadius = 90
    _outerRadius = Math.min(this._width, this._height) / 2; 
    _max = 0;
    _defaultColor = d3.scaleOrdinal([
        "#69b3a2"
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
        var data = {};
        var maxCount = 0;
        for (const [id,row] of Object.entries(result)) {
            if(row.tags){
                for(const tag of row.tags){
                    if(this._authorizedTags && Array.isArray(this._authorizedTags) && this._authorizedTags.length > 0){
                        if(this._authorizedTags.includes(tag)){
                            if(!Object.keys(data).includes(tag)){
                                data[tag] = 0;
                            }
                            data[tag]++;
                            if(maxCount < data[tag]){
                                maxCount = data[tag];
                            }
                        }
                    }else{
                        if(!Object.keys(data).includes(tag)){
                            data[tag] = 0;
                        }
                        data[tag]++;
                        if(maxCount < data[tag]){
                            maxCount = data[tag];
                        }
                    }
                }
            }
        }
        if(this._max > 0 && this._max < Object.keys(data).length){
            const entries = Object.entries(data);
            entries.sort((a,b) => b[1] - a[1]);
            const cleanedData = {}
            for (let i = 0; i < this._max; i++) {
                cleanedData[entries[i][0]] = entries[i][1]
            }
            data = cleanedData;
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
            .domain([0, this._max * 10]);
        this._rootG.append("g")
            .selectAll("g.items")
            .data(Object.entries(data))
            .join(enter => {
                const mainG = enter.append("g").classed("items", true)
                mainG.append("path")
                    .attr("fill", this._color)
                    .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                        .innerRadius(this._innerRadius)
                        .outerRadius(function(d) { return y(d[1]); })
                        .startAngle(function(d) { return x(d[0]); })
                        .endAngle(function(d) { return x(d[0]) + x.bandwidth(); })
                        .padAngle(0.01)
                        .padRadius(this._innerRadius))
                mainG.append("g")
                .attr("text-anchor", function(d) { return (x(d[0]) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
                .attr("transform", function(d) { return "rotate(" + ((x(d[0]) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (y(d[1])+10) + ",0)"; })
              .append("text")
                .text(function(d){return(d[0])})
                .attr("transform", function(d) { return (x(d[0]) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
                .style("font-size", "9px")
                .attr("alignment-baseline", "middle")
            })
            this.initZoom();
    }
}