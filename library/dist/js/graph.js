class Graph {
    _isDrawing = false;
    _isUpdating = false;
    _isDrawed = false;
    _lastResults = [];
    _rawData = [];
    _data = [];
    _zoom = null;
    _rootSvg = null;
    _rootG = null;
    _leaves = [];
    _colored = [];
    _labeled = [];
    _width = 800;
    _height = GraphUtils.heightByViewportRatio(this._width);
    _authorizedTags = [];
    _zoomInK = 1.2;
    _zoomOutK = 0.8;
    _navigationNode = null;
    _adaptInsideContainer = false;
    _resizeObserver = null;
    _timeoutResize = null;
    _canResize = false;
    _containerId = null;
    tags = [];
    _labelFunc = (d,i,n) => d.data.label;
    _beforeDraw = () => {
        console.log("BEFORE DRAW")
    };
    _afterDraw = () => {
        this.initZoom();
        const container = document.querySelector(this._containerId);
        this.adaptViewBoxByRatio(container.clientWidth / container.clientHeight);
        console.log("AFTER DRAW")
        this._isDrawed = true;
    };
    _beforeUpdate = () => {
        console.log("BEFORE UPDATE")
    };
    _afterUpdate = () => {
        console.log("AFTER UPDATE")
    };

    setBeforeUpdate(callback){
        this._beforeUpdate = callback;
    }
    setAfterUpdate(callback){
        this._afterUpdate = callback;
    }

    setLabelFunc(callback){
        this._labelFunc = callback;
    }

    _onClickNode = (event, data) => {
        console.log("CLICKED", data);
    };
    _onMouseoverNode = (event,data) => {
        console.log("MOUSEOVER", data);
    }
    _onMouseoutNode = (event,data) => {
        console.log("MOUSEOUT", data);
    }
    _onZoom = () => {};
    _defaultColor = d3.scaleOrdinal([
        "#F9C1C8",
        "#DCEEC2",
        "#FBE5C1",
        "#B6C5F0",
        "#CCEFFC",
    ]);

    /**
     *
     * @param {any} d Data inside current node
     * @param {number} i Index of current node
     * @param {node[]} n array of node[]
     * @returns
     */
    _color = (d, i, n) => {
        return this._defaultColor(i);
    };
    updateData(data, draw = true) {
        this._rawData = data;
        this._data = this._preprocessData(data);
        if(draw){
            this._update(this._data);
        }
    }
    _update(data) {}
    setOnZoom(callback) {
        this._onZoom = callback;
    }
    setOnClickNode(callback) {
        this._onClickNode = callback;
        if (this._isDrawed) {
            if (Array.isArray(this._leaves)) {
                for (const leaf of this._leaves) {
                    leaf.on("click", this._onClickNode);
                }
            } else {
                this._leaves.on("click", this._onClickNode);
            }
        }
    }
    setOnMouseoverNode(callback) {
        this._onMouseoverNode = callback;
        if (this._isDrawed) {
            if (Array.isArray(this._leaves)) {
                for (const leaf of this._leaves) {
                    leaf.on("mouseover", this._onMouseoverNode);
                }
            } else {
                this._leaves.on("mouseover", this._onMouseoverNode);
            }
        }
    }

    setOnMouseoutNode(callback) {
        this._onMouseoutNode = callback;
        if (this._isDrawed) {
            if (Array.isArray(this._leaves)) {
                for (const leaf of this._leaves) {
                    leaf.on("mouseout", this._onMouseoutNode);
                }
            } else {
                this._leaves.on("mouseout", this._onMouseoutNode);
            }
        }
    }

    setColor(callback) {
        this._color = callback;
        if (this._isDrawed) {
            var setColorByType = (current) => {
                if (current.node() instanceof SVGElement) {
                    current.attr("fill", (d, i, n) => this._color(d, i, n));
                    current.style("fill", (d, i, n) => this._color(d, i, n));
                } else if (current.node() instanceof HTMLElement) {
                    current.style("background-color", (d, i, n) => this._color(d, i, n));
                }
            }
            for (const color of this._colored) {
                if (color.node()) {
                    setColorByType(color);
                }else if(color.nodes()){
                    console.log(color)
                    color.each(function(d) {
                        console.log(d3.select(this))
                        setColorByType(d3.select(this))
                    })
                }
            }
        }
    }
    setBeforeDraw(callback) {
        this._beforeDraw = callback;
    }
    _preprocessData(data) {
        return data;
    }
    preprocessResults(results){
        this._lastResults = results;
        return results
    }
    _isDataEmpty(data) {
        if (Array.isArray(data) && data.length == 0) {
            return true;
        }
        return false;
    }
    draw(containerId) {
        this._containerId = containerId;
        d3.select(containerId)
            .attr("data-graph", this.constructor.name)
            .style("overflow", "hidden")
            .selectAll("svg.graph")
            .remove();
        this._rootSvg = d3
            .select(containerId)
            .insert("svg", ":first-child")
            .attr("id", "graph");
        this._rootG = this._rootSvg.append("g");
        this.adaptViewBoxByRatio()
        this.adaptInsideContainer()
        this.drawNavigation(containerId);
    }
    adaptViewBoxByRatio(ratio = 16/7){
        this._height = GraphUtils.heightByViewportRatio(this._width, ratio);
        if(this._height < 350){
            this._height = 350;
        }
        this._rootSvg
            .attr("viewBox", [0, 0, this._width, this._height]);
    }
    adaptInsideContainer(){
        if(!this._resizeObserver){
            this._resizeObserver = new ResizeObserver(entries => {
                if(this._canResize){
                    for (const entry of entries) {
                        this.adaptViewBoxByRatio(entry.contentRect.width / entry.contentRect.height);
                    }
                    this._canResize = false;
                    this._timeoutResize = setTimeout(() => {
                        this._timeoutResize = null;
                        this._canResize = true;
                    },300)
                }
            }) 
            this._resizeObserver.observe(document.querySelector(this._containerId))
        }
    }
    setAfterDraw(callback) {
        this._afterDraw = () => {
            callback();
            this.initZoom();
            this._isDrawed = true;
            this.setOnMouseoutNode(this._onMouseoutNode)
            this.setOnMouseoverNode(this._onMouseoverNode)
        };
    }
    initZoom = () => { 
        if(!this._rootSvg) return;
        console.log("INIT ZOOM");
        this._rootSvg.call(this._zoom.transform, d3.zoomIdentity.translate(0,0).scale(1))
    }
    _zoomBy = (value) => {
        this._zoom.scaleBy(this._rootSvg.transition(), value)
    }
    zoomIn = () => {
        this._zoomBy(this._zoomInK);
    }
    zoomOut = () => {
        this._zoomBy(this._zoomOutK);
    }
    get rootG() {
        return this._rootG;
    }
    get rootSvg() {
        return this._rootSvg;
    }
    get leaves() {
        return this._leaves;
    }
    get isDrawed() {
        return this._isDrawed;
    }
    drawNavigation(containerId){
        const container = d3.select(containerId)
        .style("background-color", "white")
            .style("position", "relative");
        
        this._navigationNode = container
            .append("xhtml:div")
            .style("height", "110px")
            .style("width", "30px")
            .style("border-radius", "4px")
            .style("box-shadow", "rgb(0 0 0 / 50%) 0px 0px 3px -1px")
            .style("background-color", "white")
            .style("z-index", 20000)
            .style("border-color", "#acacaa")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "10px")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "space-around")
            .classed("navigation", true)
        const zoomIn = this._navigationNode
            .append("xhtml:button")
            .style("width", "100%")
            .style("height", "100%")
            .style("background-color", "transparent")
            .style("border", "none")
        zoomIn.append("xhtml:i")
            .attr("class", "fa fa-plus")

        const zoomOut = this._navigationNode
            .append("xhtml:button")
            .style("width", "100%")
            .style("height", "100%")
            .style("background-color", "transparent")
            .style("border", "none")
        zoomOut.append("xhtml:i")
            .attr("class", "fa fa-minus")

        const zoomReset = this._navigationNode
            .append("xhtml:button")
            .style("width", "100%")
            .style("height", "100%")
            .style("background-color", "transparent")
            .style("border", "none")
        zoomReset.append("xhtml:i")
            .attr("class", "fa fa-arrows-alt")

        const fullscreen = this._navigationNode
            .append("xhtml:button")
            .style("width", "100%")
            .style("height", "100%")
            .style("background-color", "transparent")
            .style("border", "none")
        fullscreen.append("xhtml:i")
            .attr("class", "fa fa-window-maximize")
        
        zoomIn.on("click", this.zoomIn)
        zoomOut.on("click", this.zoomOut)
        zoomReset.on("click", this.initZoom)

        fullscreen.on("click", () => {
            if (
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
              ) {
                if (document.exitFullscreen) {
                  document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                  document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                  document.msExitFullscreen();
                }
                this.adaptViewBoxByRatio()
                d3.select(this._containerId)
                    .classed("fullscreen", false)
              } else {
                let element = document.querySelector(containerId)
                if (element.requestFullscreen) {
                  element.requestFullscreen();
                } else if (element.mozRequestFullScreen) {
                  element.mozRequestFullScreen();
                } else if (element.webkitRequestFullscreen) {
                  element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                } else if (element.msRequestFullscreen) {
                  element.msRequestFullscreen();
                }
                this._fullscreen()
              }
        })

        document.onfullscreenchange = (e) => {
            if (
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
              )
              {
                this.adaptViewBoxByRatio(window.innerWidth/window.innerHeight)
              }
        }
        
    }
    setAuthorizedTags(authorizedTags,redraw = false, isData = false){
        this._authorizedTags = authorizedTags;
        if(redraw){
            if(isData){
                this.updateData(this._rawData);
            }else{
                this.updateData(this.preprocessResults(this._lastResults));
            }
        }
    }
    _fullscreen(){
        const container = d3.select(this._containerId)
            .classed("fullscreen", true)
        const { width, height} = container.node().getBoundingClientRect();
        this.adaptViewBoxByRatio(width / height)
    }
}