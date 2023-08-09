class RadialGraph extends Graph{
    _margin = {top: 100, right: 0, bottom: 0, left: 0};
    _width = 800 - this._margin.left - this._margin.right;
    _height = 800 - this._margin.top - this._margin.bottom;
    _innerRadius = 0
    _outerRadius = Math.min(this._width, this._height) / 2; 
    _defaultColor = "#E5E5E5"
    _labelFontSize = 10
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
    _update(data){
        
        this.initZoom();
    }
}