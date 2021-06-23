class Graph {
    _isDrawing = false;
    _isUpdating = false;
    _isDrawed = false;
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
    _labelFunc = (d,i,n) => d.data.label;
    _beforeDraw = () => {
        console.log("BEFORE DRAW")
    };
    _attachViewBoxResize = () => {
        $(window).resize((e) => {
            this._height = GraphUtils.heightByViewportRatio(this._width);
            this._rootSvg.attr("viewBox", [0,0,this._width, this._height])
        })
    }
    _afterDraw = () => {
        this._attachViewBoxResize();
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
    updateData(data) {
        this._data = this._preprocessData(data);
        this._update(this._data);
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
            for (const color of this._colored) {
                if (color.node()) {
                    if (color.node() instanceof SVGElement) {
                        color.attr("fill", (d, i, n) => this._color(d, i, n));
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
    _preprocessData(data) {
        return data;
    }
    preprocessResults(results){
        const res = []
        for (const [id, value] of Object.entries(results)) {
            res.push({...value, id})
        }
        return res
    }
    _isDataEmpty(data) {
        if (Array.isArray(data) && data.length == 0) {
            return true;
        }
        return false;
    }
    draw(containerId) {
        d3.select(containerId)
            .selectAll("svg.graph")
            .remove();
        this._rootSvg = d3
            .select(containerId)
            .insert("svg", ":first-child")
            .attr("id", "graph");
    }
    setAfterDraw(callback) {
        this._afterDraw = () => {
            callback();
            this._attachViewBoxResize();
            this._isDrawed = true;
            this.setOnMouseoutNode(this._onMouseoutNode)
            this.setOnMouseoverNode(this._onMouseoverNode)
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