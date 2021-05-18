class Graph {
    _isDrawed = false;
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
                color.attr("fill", (d, i) => this._color(d, i))
            }
        }
    }
    setBeforeDraw(callback) {
        this._beforeDraw = callback;
    }
    preprocessData(data) {
        return data;
    }
    draw(idSvg) {}
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