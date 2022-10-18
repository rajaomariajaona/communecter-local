class CircleRelationGraph extends Graph {
  _id = Math.random() * 1000;
  _textColored = [];
  _circlePadding = 30;
  _splitRegex = /(?=[A-Z][a-z])|\s+/g;
  _padding = this._circlePadding - 10;
  _globalMaxX = -Infinity;
  _globalMaxY = -Infinity;
  _titleMarginBottom = 100;
  _nodes = [];
  _size = null;
  _funcGroup = null;
  _externalCircleMargin = 30;
  _textPathPadding = this._externalCircleMargin - 50;
  _links = [];
  _savedLinks = [];
  _draggable = null;
  _mobileSection = null;
  _color = () => "white";
  _relationSimulation = null;
  _onTickEnd = () => {};
  _onDragEnd = () => {};
  _modeListing = false;
  _beforeDrag = () => {};
  _initPosition = null;
  _currentMode = "graph";
  switchMode = (mode) => {}
  _onFocusChange = (newFocus) => {console.log(`FOCUS: ${newFocus}`)}
  _focusMode = false;
  _buttonGraph = null;
  _buttonList = null;
  toggleMode = () => {
    if(this._currentMode === "graph") {
      this.switchMode("list")
    }else{
      this.switchMode("graph")
    }
  }
  _lastZoom = null;
  unfocus = () => {
    if(this._focusMode){
      this._focusMode = false
      if(this._zoom){
        this._rootSvg.call(this._zoom)
        if(this._lastZoom){
          this._rootSvg.transition().duration(600).call(this._zoom.transform, this._lastZoom).end().then(() => {
            this._lastZoom = null;
          })
        }
      }
      this._onFocusChange(null);
    }
  };
  _pathGenerator = (d) =>
  `M ${d.x} ${d.y + d.r - this._textPathPadding} A 1 1 0 1 1 ${d.x} ${
      d.y - d.r + this._textPathPadding
  } M ${d.x} ${d.y - d.r + this._textPathPadding} A 1 1 0 1 1 ${d.x} ${
      d.y + d.r - this._textPathPadding
  } `;
  _onClickNodeMobile = console.log
  /**
   *
   * @param {*} data array of obj {img?: url, text?: string, id: string | number}
   * @param {*} funcGroup function to indicate which obj key to group
   */
  constructor(data, funcGroup, authorizedTags = [],links = [], draggable = true) {
    super();
    this._authorizedTags = authorizedTags;
    this._funcGroup = funcGroup;
    this._data = this._preprocessData(data);
    this._draggable = draggable;
    this._links = links;
    this._savedLinks = links;
  }
  setModeMobile(value){
    if(value){
      this._links = [];
    }else{
      this._links = this._savedLinks;
    }
    super.setModeMobile(value);
  }
  preprocessResults(results) {
    super.preprocessResults(results);
    const res = [];
    var tags = new Set();
    for (const [id, value] of Object.entries(results)) {
      if (value.tags) {
        for (const tag of value.tags) {
          if (this._authorizedTags && this._authorizedTags.length > 0) {
            if (!this._authorizedTags.includes(tag)) {
              continue;
            }
          }
          const row = {
            id,
          };
          row.label = value.name;
          row.description = value.description;
          row.img = value.profilMediumImageUrl;
          row.group = tag;
          tags.add(tag);
          res.push(row);
        }
      }
    }
    this.tags = [...tags];
    if (this._authorizedTags.length > 0) {
      this.tags = this._authorizedTags;
    }
    return res;
  }
  initZoom = () => {
    if (!this._rootSvg) return;
    const currentZoom = d3.zoomTransform(this._rootSvg.node());

    this._rootSvg.call(this._zoom.transform, d3.zoomIdentity);
    const bound = this._rootG.node().getBoundingClientRect();
    console.log(bound);
    this._rootSvg.call(this._zoom.transform, currentZoom);

    const containerBound = this._rootSvg.node().getBoundingClientRect();

    const k1 = isFinite(containerBound.width / bound.width)
      ? (containerBound.width - 50) / bound.width
      : 1;
    const k2 = isFinite(containerBound.height / bound.height)
      ? (containerBound.height - 50) / bound.height
      : 1;
    const k = k1 > k2 ? k2 : k1;

    const currentViewBox = this._rootSvg.node().viewBox.baseVal;

    //ADAPT TRANSFORMATION INTO VIEWBOX SCOPE
    const wRatio = currentViewBox.width / containerBound.width;
    const hRatio = currentViewBox.height / containerBound.height;
    let tx = containerBound.width / 2 - (bound.width / 2) * k + Math.abs(containerBound.x - bound.x) * k;
    let ty = containerBound.height / 2 - (bound.height / 2) * k + Math.abs(containerBound.y - bound.y) * k;
    tx *= wRatio;
    ty *= hRatio;
    this._rootSvg
      .transition()
      .call(this._zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  };
  _preprocessData(data) {
    this._beforeUpdate();
    this._nodes = [];

    const d = this._group(data, this._funcGroup);
    this._dfs(d);

    const packed = d3.packSiblings(this._nodes);

    let minY = Infinity;
    let minX = Infinity;
    for (let i = 0; i < packed.length; i++) {
      const x = packed[i].x - packed[i].r;
      const y = packed[i].y - packed[i].r;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      const curr_x = packed[i]["r"] + packed[i]["dr"] + packed[i]["x"];
      const curr_y = packed[i]["r"] + packed[i]["dr"] + packed[i]["y"];
      if (this._globalMaxX < curr_x) this._globalMaxX = curr_x;
      if (this._globalMaxY < curr_y) this._globalMaxY = curr_y;
    }
    if (minX != 0) {
      if (minX < 0) {
        for (let i = 0; i < packed.length; i++) {
          const x = (packed[i]["x"] += Math.abs(minX));
        }
      } else {
        for (let i = 0; i < packed.length; i++) {
          packed[i]["x"] -= Math.abs(minX);
        }
      }
    }
    if (minY != 0) {
      if (minY < 0) {
        for (let i = 0; i < packed.length; i++) {
          const y = (packed[i]["y"] += Math.abs(minY));
        }
      } else {
        for (let i = 0; i < packed.length; i++) {
          packed[i]["y"] -= Math.abs(minY);
        }
      }
    }
    // const enclose = d3.packEnclose(packed);
    // if (this._isDataEmpty(data)) {
    //     return packed;
    // }
    // CALCUL the X and Y SIZE fitting the entire graph
    // this._width = enclose.r * 2;
    return packed;
  }

  /**
   *
   * @param {*} data
   * @param {*} funcGroup
   */
  _group(data, funcGroup) {
    const group = d3.group(data, funcGroup);
    return d3
      .hierarchy(group)
      .sum((d) => d.size)
      .sort((a, b) => b.value - a.value);
  }

  set circlePadding(value) {
    this._circlePadding = value;
    this._padding = this._circlePadding - 10;
  }

  _dfs(parent) {
    if (parent.children) {
      if (parent.children[0].children) {
        // not leaf
        for (let i = 0; i < parent.children.length; i++) {
          this._dfs(parent.children[i]);
        }
      } else {
        // leaf nodes

        for (let i = 0; i < parent.children.length; i++) {
          parent.children[i]["x"] = Math.random() * 100 - 50;
          parent.children[i]["y"] = Math.random() * 100 - 50;
          if (parent.children[i]["data"].img) {
            parent.children[i]["width"] = 60;
            parent.children[i]["bw"] = parent.children[i]["width"];
            parent.children[i]["height"] = 60;
            parent.children[i]["bh"] = parent.children[i]["height"];
          } else {
            if (!parent.children[i]["textParts"]) {
              const textParts = parent.children[i]["data"].label.split(
                this._splitRegex
              );
              let maxWLen = -Infinity;
              for (const parts of textParts) {
                if (maxWLen < parts.length) {
                  maxWLen = parts.length;
                }
              }
              maxWLen *= 14;
              const len = textParts.length;
              parent.children[i]["textParts"] = textParts;
              parent.children[i]["maxWidthText"] = maxWLen;
            }
            const container = document.createElement("div");
            const div = document.createElement("div");
            container.appendChild(div);
            div.innerHTML = parent.children[i]["data"].label;
            div.setAttribute(
              "style",
              `width: ${parent.children[i]["maxWidthText"]}px; padding: 20px;`
            );
            const { width, height } =
              GraphUtils.computeBoundVirtualNode(container);

            parent.children[i]["width"] = width;
            parent.children[i]["bw"] = width;
            parent.children[i]["height"] = height;
            parent.children[i]["bh"] = height;
          }
          if (parent.children.length <= 2) {
            parent.children[i]["x"] = -parent.children[i]["width"] / 2;
            parent.children[i]["y"] = -parent.children[i]["height"] / 2;
          }
        }
        //POSITION CALCUL HERE
        const simulation = d3
          .forceSimulation()
          .force("center", d3.forceCenter(0, 0))
          .force("charge", d3.forceManyBody())
          .force(
            "collide",
            GraphUtils.rectCollide().size((d) => {
              return [d.bw, d.bh];
            })
          )
          .nodes(parent.children)
          .stop();
        const n = Math.ceil(
          Math.log(simulation.alphaMin()) /
            Math.log(1 - simulation.alphaDecay())
        );
        for (var i = 0; i < n; ++i) {
          simulation.tick();
        }

        // parent.children["simulation"] = simulation;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < parent.children.length; i++) {
          const x = Number(parent.children[i]["x"]);
          const y = Number(parent.children[i]["y"]);
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (maxX < x) maxX = x;
          if (maxY < y) maxY = y;
        }
        const minR = 0; // compute r for placing items (nodes)
        let r = minR;
        for (let i = 0; i < parent.children.length; i++) {
          const x = parent.children[i]["x"];
          const y = parent.children[i]["y"];
          const width = parent.children[i]["bw"];
          const height = parent.children[i]["bh"];
          const hyp = Math.sqrt(width ** 2 + height ** 2);
          const currR = GraphUtils.eucludianDistance(minR, minR, x, y) + hyp;
          if (r < currR) r = currR;
        }

        parent["r"] = r + this._circlePadding; // SUBSTRACT CIRCLE PADDING AT DRAWING
        parent["dr"] = parent["r"] - minR;
        this._nodes.push(parent);
      }
      // calcul couple le plus loin
    }
  }

  _correctTextParentSize() {
    const svg = this._rootG;
    const [x, y, w, h] = this._rootSvg.attr("viewBox").split(",");
    const dimension = svg.node().getBoundingClientRect();
    let k = Math.max(w, h) / Math.max(dimension.width, dimension.height);
    if (k > 2.5) {
      k = 2.5;
    }
    if (k < 1) {
      k = 1;
    }
    const parentTexts = this._rootSvg.selectAll("textPath.parent-text");
    parentTexts.style("font-size", `${30 * k}px`);
  }

  draw(containerId) {
    super.draw(containerId);
    this._drawModeSwitcher(containerId);
    this.switchMode = (mode) => {
      if (mode == "graph"){
        this._buttonGraph.classed("active", true);
        this._buttonList.classed("active", false);
        document.querySelector(containerId).classList.remove("mode-list");
        this._currentMode = mode;
      }else if(mode == "list"){
        document.querySelector(containerId).classList.add("mode-list");
        this._buttonGraph.classed("active", false);
        this._buttonList.classed("active", true);
        this._currentMode = mode;
      }else{
        console.error("MODE UNKNOWN");
      }
    }
    this._rootG.attr("id", "circle-root");
    this._zoom = d3.zoom().on("zoom", (e) => {
      if(!this._focusMode){
        this._rootG.attr("transform", e.transform);
        this._correctTextParentSize();
        this._onZoom(e);
      }
    });
    this._rootSvg.call(this._zoom);
    const filter_ombre = this._rootSvg
      .append("defs")
      .append("filter")
      .attr("id", "ombre" + this._id)
      .append("feDropShadow")
      .attr("flood-opacity", 0.3)
      .attr("dx", 0)
      .attr("dy", 1);
    this._mobileSection = d3.select(containerId)
      
    this._mobileSection.append("xhtml:div")
      .attr("class", "list-group list-group-root well")
      .attr("id","mobile-section")
    this._update(this._data);
    this._afterDraw();
    this._rootSvg.call(this._zoom.transform, d3.zoomIdentity.translate(0, 50));
    this._rootSvg.on('click', () => {
      this.unfocus();
    })
  }
  async focus(target){
    this.unfocus();
    this.boundZoomToGroup(target).then(() => {
      this._onFocusChange(target);
    })
  }
  async boundZoomToGroup(target, padding=30) {
    target = "[data-group=" + GraphUtils.slugify(target) + "]"
    const currentZoom = d3.zoomTransform(this._rootSvg.node());
    this._lastZoom = currentZoom;
    this._rootSvg.call(this._zoom.transform, d3.zoomIdentity)
    const bound = this._rootG.node().getBoundingClientRect(); console.log(bound)
    const targetBound = this._rootSvg.select(target).node().getBoundingClientRect();
    console.log(targetBound)
    this._rootSvg.call(this._zoom.transform, currentZoom);

    const containerBound = this._rootSvg.node().getBoundingClientRect();

    const k1 = isFinite(containerBound.width / bound.width) ? ((containerBound.width - 50) / bound.width): 1;
    const k2 = isFinite(containerBound.height / bound.height) ? ((containerBound.height - 50) / bound.height): 1;
    const k = (k1 > k2 ? k2 : k1);

    const l1 = isFinite(containerBound.width / targetBound.width) ? ((containerBound.width - padding * 2) / targetBound.width): 1;
    const l2 = isFinite(containerBound.height / targetBound.height) ? ((containerBound.height - padding * 2) / targetBound.height): 1;
    const l = (l1 > l2 ? l2 : l1);

    const currentViewBox = this._rootSvg.node().viewBox.baseVal;
    
    //ADAPT TRANSFORMATION INTO VIEWBOX SCOPE
    const wRatio = currentViewBox.width / containerBound.width;
    const hRatio = currentViewBox.height / containerBound.height;

    let tx = Math.abs(containerBound.x - bound.x) * k + (containerBound.width / 2 - (bound.width / 2) * k);
    let ty = Math.abs(containerBound.y - bound.y) * k + (containerBound.height / 2 - (bound.height / 2) * k);
    tx *= wRatio;
    ty *= hRatio;
    tx += currentViewBox.x
    ty += currentViewBox.y

    let ux = (containerBound.x - targetBound.x) * l + (containerBound.width / 2 - (targetBound.width / 2) * l);
    let uy = (containerBound.y - targetBound.y) * l + (containerBound.height / 2 - (targetBound.height / 2) * l);
    ux *= wRatio;
    uy *= hRatio;
    ux += currentViewBox.x
    uy += currentViewBox.y

    return this._rootSvg.transition().duration(750)
    .call(this._zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k))
    .call(this._zoom.transform, d3.zoomIdentity.translate(ux,uy).scale(l))
    .end().then(() => {
      this._focusMode = GraphUtils.slugify(target);
      this._rootSvg.on('.zoom', null)
    })
}


  _update(data) {
    this._leaves = [];
    this._colored = [];
    this._textColored = [];
    console.log(data)
    this._mobileSection
      .select("div.list-group.list-group-root.well")
      .selectAll("a.list-group-item")
      .data(data, (d) => JSON.stringify(d.data))
      .join((enter) => {
        //MOBILE
        const childrens = enter
          .append("xhtml:a")
          .attr("href", d=> "#" + GraphUtils.slugify(d.data[0]) )
          .attr("class", "list-group-item")
          .attr("data-toggle", "collapse")
          .html(d => `<i class="fa fa-chevron-right icon"></i>${d.data[1][0].group}`)
          .on('click', function() {
              const icon = d3.select(this)
                .select("i.icon")
              const contains = icon.node().classList.contains("fa-chevron-right");
              if(contains){
                icon.classed("fa-chevron-down", true)
                icon.classed("fa-chevron-right", false)
              }else{
                icon.classed("fa-chevron-down", false)
                icon.classed("fa-chevron-right", true)
              }
          })

        enter.each((d, i, n) => {
          d3.select(n[i])
            .insert("xhtml:div", `a[href="#${GraphUtils.slugify(d.data[0])}"] + *`)
            .attr("class","list-group collapse")
            .attr("id",d => GraphUtils.slugify(d.data[0]))
            .selectAll("a.list-group-item")
            .data(d => d.children)
            .join(node => {
              const a = node.append("xhmtl:a")
                .classed("list-group-item", true)
                .classed("lbh-preview-element", true)
                .attr("href", d=>`#page.type.organizations.id.${d.data.id}`)
                // .on('click', this._onClickNodeMobile)
              a.filter(d => d.data.img)
                .append("xhtml:img")
                .attr("src", (d) => d.data.img)
                .attr("alt", (d) => d.data.label)
              a.append("xhtml:span")
                .text(d => d.data.label)
            })
        })
      })

    this._rootG
      .selectAll("g")
      .data(data, (d) => JSON.stringify(d.data) + d.x + d.y + d.r)
      .join((enter) => {
        const parent_g = enter.append("g");
        parent_g.classed("divide", true)
          .attr("data-group", d => GraphUtils.slugify(d.data[0]))
        const circle_parent = parent_g
          .append("circle")
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr("r", (d) => d.r - this._circlePadding)
          .attr("stroke", "none")
          .attr("fill", (d, i) => this._color(d, i))
          .attr("filter", "url(#ombre" + this._id + ")");
        circle_parent.on("click", (e, d) => {
          if(!this._draggable){
            this.focus(d.data[0])
          }
        })
          circle_parent.call(
            d3
              .drag()
              .on("start", (e, d) => {
                this._beforeDrag();
                if(this._draggable){
                  if (!e.active){
                    this._restartSimulation()
                  }
                }
              })
              .on("drag", (e, d) => {
                if(this._draggable){
                  d.x = e.x;
                  d.y = e.y;
                }
              })
              .on("end", (e, d) => {
                if(this._draggable){
                  if (!e.active) this._relationSimulation.alphaTarget(0);
                  this._onDragEnd()
                }
              })
          );
        this._colored.push(circle_parent);
        const leaf_svg = parent_g
          .append("g")
          .style("overflow", "visible")
          .classed("leaf-svg", true)
          .attr(
            "transform",
            (d) => `translate(${d.x - d.r + d.dr}, ${d.y - d.r + d.dr})`
          );
        // .attr("x", (d) => d.x)
        // .attr("y", (d) => d.y);
        parent_g
          .append("g")
          .classed("external-cirlcles", true)
          .append("circle")
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y)
          .attr(
            "r",
            (d) => d.r - this._circlePadding + this._externalCircleMargin
          )
          .attr("fill", "none")
          .attr("stroke-width", 10)
          .attr("stroke-dasharray", "10 14")
          .style("stroke", (d, i) => this._color(d, i));
        parent_g
          .append("path")
          .classed("text-path", true)
          .attr("stroke", "none")
          .attr("fill", "none")
          .attr("id", (d) => `path-${GraphUtils.slugify(d["data"][0])}-${this._id}`)
          .attr("d",this._pathGenerator);
        const text = parent_g
          .append("text")
          .append("textPath")
          .style("font-size", "30px")
          .classed("svg-text", true)
          .classed("parent-text", true)
          .attr(
              "xlink:href",
              (d) => `#path-${GraphUtils.slugify(d["data"][0])}-${this._id}`
          )
          .text((d) => d.children[0].data.group)
          .attr("fill", this._color)
          .attr("text-anchor", "middle")
          .attr("startOffset", "50%");
      });
    this._rootG
      .selectAll("g.links")
      .data(this._links)
      .join((enter) => {
        enter
          .insert("g", ":first-child")
          .classed("links", true)
          .append("line")
          .classed("links-line", true)
          .attr("stroke-width", 4)
          .attr("stroke-dasharray", "10 14")
          .style("stroke", "white");
      });

    this._rootSvg
      .selectAll("g.leaf-svg")
      .selectAll("g")
      .data(
        (d) => d.children,
        (d) => {
          return JSON.stringify(d.data);
        }
      )
      .join((enter) => {
        const leaf_svg_g = enter
          .append("g")
          .style("cursor", "pointer")
          .classed("leaf-group", true)
          .on("click", this._onClickNode);

        this._leaves.push(leaf_svg_g);

        const foreign = leaf_svg_g
          .append("foreignObject")
          .classed("nodes-container", true)
          .style("overflow", "visible")
          .attr("width", (d) => Number(d.width))
          .attr("height", (d) => Number(d.height))
          .attr("x", (d) => Number(d.x))
          .attr("y", (d) => Number(d.y))
          .style("transform-box", "fill-box")
          .style("transform", "translate(-50%, -50%)");

        foreign
          .filter((d) => !d.data.img)
          .append("xhtml:div")
          .style("overflow", "hidden")
          .style("text-align", "center")
          .style("padding", "10px")
          .style("display", "flex")
          .style("justify-content", "center")
          .style("align-items", "center")
          .style("background-color", "transparent")
          .style("color", "#455a64")
          .style("border", "2px solid rgba(69, 90, 100, 0.5)")
          .style("border-radius", "5px")
          .text((d) => d.data.label)
          .on("click", this._onClickNode);

        foreign
          .filter((d) => d.data.img)
          .append("xhtml:div")
          .style("overflow", "hidden")
          .style("max-width", "100%")
          .style("max-height", "100%")
          .style("font-size", "6px")
          .append("xhtml:img")
          .attr("src", (d) => d.data.img)
          .attr("alt", (d) => d.data.label)
          .style("width", "100%")
          .style("height", "auto");

        // const imgs = leaf_svg_g
        //     .filter((d) => d.data.img)
        //     .append("image")
        //     .attr("xlink:href", (d) => d.data.img)

        this._leaves.push(foreign);
      });
    this._correctTextParentSize();
    if (!this._isDataEmpty(data)) {
      this._links = GraphUtils.filterLinks(this._links, data.map((v) => v.data[0]))
      if(this._initPosition){
        this._rootG.selectAll("g.divide").each((d) => {
          if(this._initPosition[d.data[0]]){
            d.x = Number(this._initPosition[d.data[0]].x)
            if(isNaN(d.x)){
              d.x = 0;
            }
            d.y = Number(this._initPosition[d.data[0]].y)
            if(isNaN(d.y)){
              d.y = 0;
            }
          }
        })
      }
      var i = 0;
      this._relationSimulation = d3
        .forceSimulation(data)
        .force(
          "collide",
          d3.forceCollide().radius((d) => d.r + this._externalCircleMargin + 30)
        )
        .force(
          "link",
          d3
            .forceLink(this._links)
            .id((d) => d.data[0].toLowerCase())
            .strength(0)
        )
        .on("tick", () => {
          i++;
          this._rootG
            .selectAll("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y);
          this._rootG
            .selectAll("path.text-path")
            .attr("d",this._pathGenerator);
          this._rootG
            .selectAll("g.leaf-svg")
            .attr(
              "transform",
              (d) => `translate(${d.x - d.r + d.dr}, ${d.y - d.r + d.dr})`
            );
          //update link positions
          const lines = this._rootG
            .selectAll(".links-line")
          lines.each((data, i, nodes) => {
            if(isNaN(Number(data.source.x))){
              d3.select(nodes[i]).remove();
            }else{
              d3.select(nodes[i]).attr("x1", (d) => {
                var res = Number(d.source.x);
                var h = GraphUtils.eucludianDistance(
                  d.source.x,
                  d.source.y,
                  d.target.x,
                  d.target.y
                );
                const dx =
                  ((d.source.x - d.target.x) *
                    (d.source.r +
                      this._externalCircleMargin -
                      this._circlePadding +
                      15)) /
                  h;
                res -= dx;
                return res;
              })
              .attr("y1", (d) => {
                var res = Number(d.source.y);
                var h = GraphUtils.eucludianDistance(
                  d.source.x,
                  d.source.y,
                  d.target.x,
                  d.target.y
                );
                const dx =
                  ((d.source.y - d.target.y) *
                    (d.source.r +
                      this._externalCircleMargin -
                      this._circlePadding +
                      15)) /
                  h;
                res -= dx;
                return res;
              })
              .attr("x2", (d) => {
                var res = Number(d.target.x);
                var h = GraphUtils.eucludianDistance(
                  d.source.x,
                  d.source.y,
                  d.target.x,
                  d.target.y
                );
                const dx =
                ((d.source.x - d.target.x) *
                (d.target.r +
                  this._externalCircleMargin -
                  this._circlePadding +
                  15)) /
                  h;
                  res += dx;
                return res;
              })
              .attr("y2", (d) => {
                var res = Number(d.target.y);
                var h = GraphUtils.eucludianDistance(
                  d.source.x,
                  d.source.y,
                  d.target.x,
                  d.target.y
                );
                const dx =
                  ((d.source.y - d.target.y) *
                    (d.target.r +
                      this._externalCircleMargin -
                      this._circlePadding +
                      15)) /
                  h;
                res += dx;
                return res;
              });
            }
          });
          if(i == 20){
            this.initZoom();
          }
        })
        .on("end", () => {
          this._onTickEnd();
          i = 0;
        })
    }
    this._afterUpdate();
  }
  _restartSimulation(){
    this._relationSimulation.alphaTarget(0.3).restart();
  }
  _drawModeSwitcher(containerId) {
    const container = d3.select(containerId)
    this._navigationNode = container
            .append("xhtml:div")
            .style("border-radius", "4px")
            .style("box-shadow", "rgb(0 0 0 / 50%) 0px 0px 5px 0px")
            .style("background-color", "white")
            .style("z-index", 20000)
            .style("border-color", "#acacaa")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "10px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "space-around")
            .classed("group-button-switcher", true)
    const iconSize = 20;
    const svgListIcon = `
      <svg style="height: ${iconSize}px; width: ${iconSize}px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="svg-list-icon" x="0px" y="0px" viewBox="0 0 297 297" style="enable-background:new 0 0 297 297;" xml:space="preserve">
            <path d="M66.102,0H15.804C7.089,0,0,7.089,0,15.804v50.298c0,8.715,7.089,15.804,15.804,15.804h50.298     c8.715,0,15.804-7.089,15.804-15.804V15.804C81.907,7.089,74.817,0,66.102,0z"/>
            <path d="M173.649,0h-50.298c-8.715,0-15.804,7.089-15.804,15.804v50.298c0,8.715,7.089,15.804,15.804,15.804h50.298     c8.715,0,15.804-7.089,15.804-15.804V15.804C189.453,7.089,182.364,0,173.649,0z"/>
            <path d="M66.102,107.547H15.804C7.089,107.547,0,114.636,0,123.351v50.298c0,8.715,7.089,15.804,15.804,15.804h50.298     c8.715,0,15.804-7.089,15.804-15.804v-50.298C81.907,114.636,74.817,107.547,66.102,107.547z"/>
            <path d="M173.649,107.547h-50.298c-8.715,0-15.804,7.089-15.804,15.804v50.298c0,8.715,7.089,15.804,15.804,15.804h50.298     c8.715,0,15.804-7.089,15.804-15.804v-50.298C189.453,114.636,182.364,107.547,173.649,107.547z"/>
            <path d="M281.196,0h-50.298c-8.715,0-15.804,7.089-15.804,15.804v50.298c0,8.715,7.089,15.804,15.804,15.804h50.298     c8.715,0,15.804-7.089,15.804-15.804V15.804C297,7.089,289.911,0,281.196,0z"/>
            <path d="M281.196,107.547h-50.298c-8.715,0-15.804,7.089-15.804,15.804v50.298c0,8.715,7.089,15.804,15.804,15.804h50.298     c8.715,0,15.804-7.089,15.804-15.804v-50.298C297,114.636,289.911,107.547,281.196,107.547z"/>
            <path d="M66.102,215.093H15.804C7.089,215.093,0,222.183,0,230.898v50.298C0,289.911,7.089,297,15.804,297h50.298     c8.715,0,15.804-7.089,15.804-15.804v-50.298C81.907,222.183,74.817,215.093,66.102,215.093z"/>
            <path d="M173.649,215.093h-50.298c-8.715,0-15.804,7.089-15.804,15.804v50.298c0,8.715,7.089,15.804,15.804,15.804h50.298     c8.715,0,15.804-7.089,15.804-15.804v-50.298C189.453,222.183,182.364,215.093,173.649,215.093z"/>
            <path d="M281.196,215.093h-50.298c-8.715,0-15.804,7.089-15.804,15.804v50.298c0,8.715,7.089,15.804,15.804,15.804h50.298     c8.715,0,15.804-7.089,15.804-15.804v-50.298C297,222.183,289.911,215.093,281.196,215.093z"/>
      </svg>
    `
    const svgGraphIcon = `
    <svg style="height: ${iconSize}px; width: ${iconSize}px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="svg-graph-icon" x="0px" y="0px" viewBox="0 0 349.899 349.898" style="enable-background:new 0 0 349.899 349.898;" xml:space="preserve">
      <path d="M175.522,12.235c-42.6,0-77.256,34.649-77.256,77.25c0,42.6,34.656,77.255,77.256,77.255    c42.591,0,77.257-34.656,77.257-77.255C252.779,46.895,218.113,12.235,175.522,12.235z"/>
      <path d="M77.255,337.663c42.599,0,77.255-34.641,77.255-77.251c0-42.594-34.656-77.25-77.255-77.25    C34.653,183.162,0,217.818,0,260.412C0,303.012,34.653,337.663,77.255,337.663z"/>
      <path d="M272.648,183.151c-42.603,0-77.256,34.65-77.256,77.256c0,42.604,34.653,77.25,77.256,77.25    c42.6,0,77.251-34.646,77.251-77.25C349.909,217.818,315.248,183.151,272.648,183.151z"/>
    </svg>
    `
    this._buttonGraph = this._navigationNode.append("xhtml:div")
      .style("padding", "10px")
      .classed("button-switcher-mode", true)
      .classed("active", true)
      .style("display", "flex")
      .style("justify-content", "center")
      .style("align-items", "center")
      .html(svgGraphIcon)
      .on("click", () => {
        if(this._currentMode != "graph"){
          this.switchMode("graph");
        }
      })
    this._buttonList = this._navigationNode.append("xhtml:div")
      .style("padding", "10px")
      .classed("button-switcher-mode", true)
      .style("display", "flex")
      .style("justify-content", "center")
      .style("align-items", "center")
      .html(svgListIcon)
      .on("click", () => {
        if(this._currentMode != "list"){
          this.switchMode("list");
        }
      })
  }
  setColor(callback) {
    super.setColor(callback);
    for (const text of this._textColored) {
      text.attr("fill", (d, i) =>
        GraphUtils.colorLuminance(this._color(d, i), -0.2)
      );
    }
  }
  setOnTickEnd(callback){
    this._onTickEnd = callback;
  }
  setOnDragEnd(callback){
    this._onDragEnd = callback;
  }
  setBeforeDrag(callback){
    this._beforeDrag = callback;
  }
  setDraggable(value){
    this._draggable = !!value;
  }
  setInitPosition(value){
    this._initPosition = value;
  }
  setOnClickNodeChildren(callback){
    this._onClickNodeMobile = callback;
  }
  setOnFocusChange(callback){
    this._onFocusChange = callback;
  }
}
