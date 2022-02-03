class VennGraph extends Graph {
    _sets = {}

    constructor(rawData,authorizedTags = []) {
        super();
        if(Array.isArray(rawData) && rawData.length > 0){
            this._data = this._preprocessData(rawData);
            this._data = venn.layout(this._data);
        }else{
            this._data = [];
        }
        
        this._authorizedTags = authorizedTags;
    }

    preprocessResults(results){
        super.preprocessResults(results);
        const res = []
        var tagsSet = new Set();
        for (const [id, value] of Object.entries(results)) {
            var tags = value.tags;
            if(!tags){
                continue;
            }
            var groups = tags;
            if(this._authorizedTags && this._authorizedTags.length > 0){
                groups = tags.filter(x => this._authorizedTags.indexOf(x) !== -1);
            }
            if(!groups || !groups.length > 0){
                continue;
            }
            for (const group of groups) {
                tagsSet.add(group);
            }
            res.push({...value, id, groups, label: value.name ? value.name : "", img: value.profilMediumImageUrl})
        }
        this.tags = [...tagsSet];
        if(this._authorizedTags.length > 0){
            this.tags = this._authorizedTags;
        }
        return res
    }

    _preprocessData(dataRaws) {
        let data = {},
            existingMix = new Set(),
            allSets = {};
            
        for (const dataRaw of dataRaws) {
            const sets = dataRaw.groups
            sets.sort()
            const mix = sets.join(",");
            if(!Object.keys(data).includes(mix)){
                data[mix] = {
                    data: [],
                    sets: sets
                }
            }
            data[mix].data.push({
                data: dataRaw,
                sets
            });
            if(!Object.keys(allSets).includes(mix)){
                allSets[mix] = 1
            }else{
                allSets[mix]++
            }
            if(sets.length > 1){
                for (const set of sets) {
                    if(!Object.keys(allSets).includes(set)){
                        allSets[set] = 1
                    }else{
                        allSets[set]++
                    }
                }
            }
            existingMix.add(mix);
        }
        for (const [k,v] of Object.entries(allSets)) {
            if(!Object.keys(data).includes(k)){
                data[k] = {}
                data[k].data = []
                data[k].sets = [k]
                data[k].size = allSets[k] * 2
            }else{
                data[k].size = allSets[k] * 2
            }
        }
        return Object.values(data);
    }

    draw(containerId) {
        super.draw(containerId);
        this._rootG.append("g").attr("id", "venn-group");
        this._zoom = d3.zoom().on("zoom", (e) => {
            this._rootG.attr("transform", e.transform);
            this._onZoom(e);
        });
        this._rootSvg.call(this._zoom);
        this._update();
        this._afterDraw()
    }

    adaptViewBoxByRatio(ratio = 16/7){
        this._height = GraphUtils.heightByViewportRatio(this._width,ratio);
        this._rootSvg
            .attr("viewBox", [0, 0,this._width,this._height]);
    }

    updateData(rawData, draw = true) {
        this._data = this._preprocessData(rawData);
        this._data = venn.layout(this._data);
        if(draw){
            this._update();
        }
    }
    _update(data) {
        this._beforeDraw();
        console.log(this._data)
        const g = this._rootG
            .selectAll('g')
            .data(this._data)
            .join((enter) => {
                    const g = enter.append('g');
                    g.append('path');
                    g.append('circle');
                return g;
            });
        g.select('circle')
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr('r', d => {
                const r = d.innerCircle.innerRadius;
                if(r < 0){
                    return 0
                }
                return r
            })
            .attr('cx',(d) => d.innerCircle.x)
            .attr('cy',(d) => d.innerCircle.y);
        g.select('path')
            .attr('d', (d) => d.distinctPath)
            .style('fill', (d, i) => (d3.schemeCategory10[Math.floor(Math.random() * 10)]));
        this._afterDraw();
    }
    initZoom = () => {

    }
}