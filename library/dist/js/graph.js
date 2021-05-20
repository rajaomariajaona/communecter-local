class Graph {
    _isDrawed = false;
    _data = [];
    _zoom = null;
    _canZoom = null;
    _rootSvg = null;
    _rootG = null;
    _leaves = [];
    _colored = [];
    _width = 800;
    _height = 800;
    _beforeDraw = () => {};
    _afterDraw = () => {
        this._isDrawed = true;
    };

    _onClickNode = (event, data) => {
        console.log("CLICKED", data)
    };
    _onZoom = () => {};
    _defaultColor = d3.scaleOrdinal(['#F9C1C8', '#DCEEC2', '#FBE5C1', '#B6C5F0', '#CCEFFC']);

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
    resetZoom() {

    }
    updateData(data) {
        this._data = this.preprocessData(data);
        this.update(this._data)
    }
    update(data) {

    }
    setOnZoom(callback) {
        this._onZoom = callback;
    }
    setOnClickNode(callback) {
        this._onClickNode = callback;
        if (this._isDrawed) {
            if (Array.isArray(this._leaves)) {
                for (const leaf of this._leaves) {
                    leaf.on('click', this._onClickNode)
                }
            } else {
                this._leaves.on('click', this._onClickNode)
            }
        }
    }
    setColor(callback) {
        this._color = callback;
        if (this._isDrawed) {
            for (const color of this._colored) {
                if (color.node()) {
                    if (color.node() instanceof SVGElement) {
                        color.attr("fill", (d, i, n) => this._color(d, i, n))
                    } else if (color.node() instanceof HTMLElement) {
                        color.style("background-color", (d, i, n) => this._color(d, i, n));
                    }
                }
            }
        }
    }
    setBeforeDraw(callback) {
        this._beforeDraw = callback;
    }
    preprocessData(data) {
        return data;
    }
    draw(containerId) {
        d3.select("#" + containerId).selectAll("svg#graph").remove();
        this._rootSvg = d3.select("#" + containerId)
            .insert("svg", ":first-child")
            .attr("id", "graph")
    }
    setAfterDraw(callback) {
        this._afterDraw = () => {
            callback()
            this._isDrawed = true;
        };
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
}