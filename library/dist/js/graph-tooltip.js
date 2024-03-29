class GraphTooltip {
    _defaultImage = null;
    _last = null;
    _node = null;
    _titleContainer = null;
    _image = null;
    _anchor = null;
    _description = null;
    _parent = null;
    tooltip = null;

    constructor(containerId) {
        this._parent = containerId;
        const container = d3.select(containerId)
        .style("position", "relative")
        .style("overflow", "hidden");
        if(!container.select("div#graph-tooltip").node()){
            this.tooltip = container
            .append("xhtml:div")
            .attr("id", "graph-tooltip")
            .style("width", "350px")
            .style("display", "none")
            .html(`
            <i class="fa fa-close" style="position: absolute;top: 10px;font-size: 16px;right: 10px; cursor:pointer; z-index:1;" id="graph-tooltip-close"> </i>
            <div class="container-fluid">
            <div class="row">
            <div class="col-xs-12" style="display: flex; align-items: center;">
                <div style="margin-right: 10px;">
                <div id="bulle-image" style="height: 50px; width: 50px; display: block; border-radius: 50%; background-size: contain; background-repeat: no-repeat; background-position: center center; box-shadow: 0px 0px 5px -2px rgb(0 0 0 / 50%);">
                </div>
                
                </div>
                <h3 style="display: block; font-size: 0.9em" id="bulle-title">Titre</h3>
                </div>
                </div>
                <div class="row" id="bulle-description">
                <div class="col-xs-12">
                <span style="display: block; border-bottom: 1px solid #455a64; font-size: 1.1em; margin-bottom: 10px;">Description</span>
                </div>
                <div class="col-xs-12">
                <p class="description" style="font-size: 0.8em; text-align: justify;">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Veniam quos, odio id suscipit qui tempore.
                </p>
                </div>
                </div>
                <div class="row">
                <div class="col-xs-12" style="text-align: center;">
                <a class="btn btn-more" id="bulle-anchor" href="#page.type.organizations.id.60631a86c7f7b859ca733385">
                En savoir plus
                </a>
                </div>
                </div>
                </div>
                <div class="bulle-arrow"></div>`)
        }else{
            this.tooltip = container.select("div#graph-tooltip")
        }
        this.tooltip.select("#graph-tooltip-close").on('click', () => this.hide());
        this._title = this.tooltip.select("#bulle-title");
        this._image = this.tooltip.select("#bulle-image");
        this._anchor = this.tooltip.select("#bulle-anchor");
        this._anchor.on('click', () => this.hide())
        this._description = this.tooltip.select("#bulle-description");
    }

    set defaultImage(img) {
        this._defaultImage = img;
    }
    set node(n) {
        this._node = n;
        this.goToNode()
    }
    goToNode() {
        if (this._node != null && this._node.node()) {
            
            const n = $(this._node.node())
            var childPos = n.offset();
            const bnd = this._node.node().getBoundingClientRect();
            var parentPos = $(this._parent).offset();
            const style = {
                top: childPos.top - parentPos.top,
                left: childPos.left - parentPos.left
            }
            this.tooltip
                .style("top", style.top + "px")
                .style("left", (style.left + bnd.width / 2) + "px")
                .style("transform", `translate(-50%,calc(-100% - 20px ))`)
        }
    }
    setContent(data, modePreview = true) {
        if (data == this._last)
            return
        const d = data.data;
        if (d.img) {
            this._image.style("background-image", `url(${d.img})`)
        } else {
            this._image.style("background-image", `url(${this.defaultImage})`)
        }
        this._title.text(d.label)

        if (d.description) {
            this._description.style("display", 'block')
                .select("p.description")
                .text(GraphUtils.truncate(d.description.replace(/(<([^>]+)>)/gi, ""), 150))
        } else {
            this._description.style("display", 'none')
        }
        var collection = 'organizations';
        if(data.collection){
            collection = data.collection;
        }else if(d.collection){
            collection = d.collection;
        }
        this._anchor
            .attr("href", `#page.type.${collection}.id.${d.id}`)
        if(modePreview){
            this._anchor.classed("lbh-preview-element", true)
        }else{
            this._anchor.classed("lbh", true)
        }
        this._last = data;
    }
    show() {
        this.tooltip.style("display", "block")
    }
    hide() {
        this.tooltip.style("display", "none")
    }
}