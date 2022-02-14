class SwipableGraph extends Graph{
    _currentPage = 0;
    _modeMobile = false;
    _allTags = [];
    _controlsNode = null;
    _saveBeforeSwitchModeToMobile() {
        this._allTags = this.tags;
    }
    _restoreAfterSwitchModeToDesktop() {
        this._allTags = []
    }
    swipeLeft(){
        if(this._modeMobile){
            if(this._currentPage <= 0){
                this._currentPage = this._allTags.length - 1;
            }else{
                this._currentPage--;
            }
            this.goToCurrentPage()
        }
    }
    swipeRight(){
        if(this._modeMobile){
            if(this._currentPage >= this._allTags.length - 1){
                this._currentPage = 0;
            }else{
                this._currentPage++;
            }
            this.goToCurrentPage()
        }
    }
    goToCurrentPage(){
        if(this._modeMobile){
            this.setAuthorizedTags([this._allTags[this._currentPage]], true)
        }
    }
    setModeMobile(value){
        if(value){
            if(this._modeMobile) return;
            this._drawControls();
            this._modeMobile = true;
            this._saveBeforeSwitchModeToMobile()
            this.setAuthorizedTags([this._allTags[this._currentPage]], true)
        }else{
            if(!this._modeMobile) return;
            this._removeControls();
            this._modeMobile = false;
            this.setAuthorizedTags(this._allTags, true)
            this._restoreAfterSwitchModeToDesktop()
        }
    }
    _drawControls(){
        if(this._controlsNode){
            this._controlsNode.style("display", "flex")
            return;
        }
       const container = d3.select(this._containerId)
        .style("background-color", "white")
        .style("position", "relative");
    
        this._controlsNode = container
            .append("xhtml:div")
            .style("height", "30px")
            .style("width", "70px")
            .style("border-radius", "4px")
            .style("box-shadow", "rgb(0 0 0 / 50%) 0px 0px 3px -1px")
            .style("background-color", "white")
            .style("z-index", 20000)
            .style("border-color", "#acacaa")
            .style("position", "absolute")
            .style("bottom", "10px")
            .style("left", "50%")
            .style("transform", "translateX(-50%)")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "space-around")
        const chevronLeft = this._controlsNode
            .append("xhtml:button")
            .style("width", "100%")
            .style("height", "100%")
            .style("background-color", "transparent")
            .style("border", "none")
        chevronLeft.append("xhtml:i")
            .attr("class", "fa fa-chevron-left")
        chevronLeft.on('click', () => {
            this.swipeLeft()
        })
        const chevronRight = this._controlsNode
            .append("xhtml:button")
            .style("width", "100%")
            .style("height", "100%")
            .style("background-color", "transparent")
            .style("border", "none")
        chevronRight.append("xhtml:i")
            .attr("class", "fa fa-chevron-right")
        chevronRight.on('click', () => {
            this.swipeRight()
        })
    }
    _removeControls(){
        this._controlsNode.style("display", "none")
    }
}