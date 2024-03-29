


class SvgUtils {
    static setPoint(element, point, fire = true){
        element.setAttribute('x', point.x)
        element.setAttribute('y', point.y)
        if(fire){
            Handler.getInstance().dispatchHandler(element);
        }
    }
    static setRect(element, x,y,width,height){
        SvgUtils.setRectViaRectangle(element, Rectangle.fromXY(x,y,width,height));
    }
    static setRectViaRectangle(element, rect){
        SvgUtils.setPoint(element, rect.point, false);
        element.setAttribute('width', rect.width);
        element.setAttribute('height', rect.height);
        Handler.getInstance().dispatchHandler(element);
    }
    static getRectOfElement(element){
        var x = element.getAttribute('x');
        x = x ? parseFloat(x) : 0;
        var y = element.getAttribute('y');
        y = y ? parseFloat(y) : 0;
        var width = element.getAttribute('width');
        width = width ? parseFloat(width) : 0;
        var height = element.getAttribute('height');
        height = height ? parseFloat(height) : 0;
        var change = false;
        if(width == 0 ){
            width = 400;
            element.setAttribute('width',width);
            change = true;
        }
        if(height == 0){
            height = 400;
            element.setAttribute('height',height);
            change = true;
        }
        if(change){
            Handler.getInstance().dispatchHandler(element);
        }
        return Rectangle.fromXY(x,y,width, height);
    }

    static getMousePosition(event) {
        var CTM = Artboard.getInstance().artboard.getScreenCTM();
        return {
          x: (event.clientX - CTM.e) / CTM.a,
          y: (event.clientY - CTM.f) / CTM.d
        };
    }
    static insertAtIndex(element, index){
        const artboard = Artboard.getInstance().artboard;
        if(index < 0){
            throw 'Negative Index';
        }else if(index >= artboard.childElementCount){
            artboard.appendChild(element);
        }else{
            artboard.insertBefore(element, artboard.children[index]);
        }
    }
    static saveIntoPng(){
        var svg = Artboard.getInstance().artboard;
        var svgData = new XMLSerializer().serializeToString( svg );

        var canvas = document.createElement( "canvas" );
        var svgSize = svg.getBoundingClientRect();
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;
        var ctx = canvas.getContext( "2d" );

        var img = document.createElement( "img" );
        img.setAttribute( "src", "data:image/svg+xml;base64," + btoa( svgData ) );
        img.onload = function() {
            ctx.drawImage( img, 0, 0 );
            var a = document.createElement("a");
            var href = canvas.toDataURL( "image/png" );
            console.log(href);
            a.setAttribute("href", href);
            a.setAttribute("download", "badge.png");
            a.click();
        };
    }
}

window.SvgUtils = SvgUtils;

class StackControl {

    constructor(){
        const btnUndo = document.querySelector("#btn-undo");
        const btnRedo = document.querySelector("#btn-redo");
        btnUndo.addEventListener('click', (event) => {
            this.back();
        });
        btnRedo.addEventListener('click', (event) => {
            this.forward();
        });
    }
    commands = [];
    deletedCommands = [];
    do(command){
        this.deletedCommands = [];
        this.commands.push(command);
        command.execute();
        this.checkAndDisableBtn();
    }
    forward(){
        if(this.canForward()){
            const lastCommand = this.deletedCommands.pop();
            this.commands.push(lastCommand);
            lastCommand.execute();
            this.checkAndDisableBtn();
        }
    }
    back(){
        if(this.canBack()){
            const lastCommand = this.commands.pop();
            this.deletedCommands.push(lastCommand);
            lastCommand.revert();
            this.checkAndDisableBtn();
        }
    }
    canForward(){
        return this.deletedCommands.length > 0;
    }
    canBack(){
        return this.commands.length > 0;
    }
    checkAndDisableBtn(){
        const btnUndo = document.querySelector("#btn-undo");
        const btnRedo = document.querySelector("#btn-redo");
        if(!this.canBack()){
            btnUndo.setAttribute('disabled', "true");
        }else{
            btnUndo.removeAttribute('disabled');
        }
        if(!this.canForward()){
            btnRedo.setAttribute('disabled', "true");
        }else{
            btnRedo.removeAttribute('disabled');
        }
    }
}

window.StackControl = StackControl;

class Point{
    constructor(x,y){
        this._x = x;
        this._y = y;
    }
    _x = 0;
    _y = 0;
    get x (){ return this._x;}
    get y (){ return this._y;}
    set x (_x){ this._x = _x;}
    set y (_y){ this._y = _y;}
}

class Rectangle{
    _point;
    _width;
    _height;
    static fromPoint(point, width, height){
        var rect = new Rectangle();
        rect.point = point;
        rect.width = width;
        rect.height = height;
        return rect;
    }
    static fromXY(x,y,width, height){
        return Rectangle.fromPoint(new Point(x,y), width, height);
    }

    get point (){ return this._point;}
    set point (_point){ this._point = _point;}

    get width (){ return this._width;}
    set width (_width){ this._width = _width;}

    get height (){ return this._height;}
    set height (_height){ this._height = _height;}
    toObject(){
        return {x: this.point.x, y: this.point.y, width: this.width, height: this.height};
    }
}

window.Point = Point;

class Command {
    execute(){}
    revert(){}
}

window.Command = Command;

class DragCommand extends Command {
    _start = null;
    _target = null;
    _element = null;
    constructor(element,start, target){
        super();
        this._start = start;
        this._target = target;
        this._element = element;
    }
    execute(){
        if(this._element && this._element instanceof SVGElement && this._target){
            SvgUtils.setPoint(this._element, this._target);
        }
    }
    revert(){
        if(this._element && this._element instanceof SVGElement && this._start){
            SvgUtils.setPoint(this._element, this._start);
        }
    }
    static attachDragEvent(element){
        element.removeEventListener("mousedown", DragCommand.dragStart);
        element.removeEventListener("mouseup", DragCommand.dragEnd);
        element.addEventListener("mousedown", DragCommand.dragStart);
        element.addEventListener("mouseup", DragCommand.dragEnd);
    }
    static dragStart(event) {
        event.preventDefault();
        event.stopPropagation();
        const target = event.currentTarget;
        CurrentElement.selectedElement = target;
        var x = target.getAttribute('x');
        x = x ? parseFloat(x) : 0;
        var y = target.getAttribute('y');
        y = y ? parseFloat(y) : 0;

        startDragPoint = new Point(x,y);

        CurrentElement.offset = SvgUtils.getMousePosition(event);
        CurrentElement.offset.x -= x;
        CurrentElement.offset.y -= y;
        document.addEventListener("mouseup", DragCommand.dragEnd);
        document.addEventListener("mousemove", DragCommand.drag);
    }
    
    static dragEnd(event) {
        event.preventDefault();
        event.stopPropagation();
        document.removeEventListener("mouseup", DragCommand.dragEnd);
        document.removeEventListener("mousemove", DragCommand.drag);
        if(CurrentElement.isDragging){
            CurrentElement.isDragging = false;
            const {x,y} = SvgUtils.getRectOfElement(CurrentElement.selectedElement).toObject();
            Artboard.getInstance().stackControl.do(new DragCommand(CurrentElement.selectedElement, startDragPoint, new Point(x,y)));
            console.log("DRAGEND");
        }
    }
    static drag(event){
        if(!CurrentElement.isDragging){
            console.log("DRAGSTART");
            CurrentElement.isDragging = true;
        }
        if(CurrentElement.isDragging){
            event.preventDefault();
            event.stopPropagation();
            var coord = SvgUtils.getMousePosition(event);
            SvgUtils.setPoint(CurrentElement.selectedElement, new Point(coord.x - CurrentElement.offset.x, coord.y - CurrentElement.offset.y));
        }
    }
}
window.DragCommand = DragCommand;

class DuplicateCommand extends Command{
    _element;
    _duplicatedElement;
    constructor(element){
        super();
        this._element = element;
        this._duplicatedElement = element.cloneNode(true);
    }
    execute(){
        var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
        if(index != Artboard.getInstance().artboard.childElementCount - 1){
            Artboard.getInstance().artboard.insertBefore(this._duplicatedElement, Artboard.getInstance().artboard.children[index + 1]);
        }else{
            Artboard.getInstance().artboard.appendChild(this._duplicatedElement);
        }
        var {x,y} = SvgUtils.getRectOfElement(this._element).toObject();
        x += 20;
        y += 20;
        SvgUtils.setPoint(this._duplicatedElement,new Point(x,y),false);
        CurrentElement.selectedElement = this._duplicatedElement;
    }
    revert(){
        Artboard.getInstance().artboard.removeChild(this._duplicatedElement);
        if(CurrentElement.selectedElement == this._duplicatedElement){
            CurrentElement.selectedElement = null;
        }
    }
}
window.DuplicateCommand = DuplicateCommand;

class DeleteCommand extends Command{
    _element;
    _position = 0;
    constructor(element){
        super();
        this._element = element;
    }
    execute(){
        this._position = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
        if(this._position >= 0){
            Artboard.getInstance().artboard.removeChild(this._element);
            CurrentElement.selectedElement = null;
        }
    }
    revert(){
        SvgUtils.insertAtIndex(this._element, this._position);
    }

}

window.DeleteCommand = DeleteCommand;

class LayerCommand extends Command{
    _possibleRequest = ['down', 'up'];
    _element;
    _request;
    constructor(element, request){
        super();
        if(!this._possibleRequest.includes(request)){
            throw 'Command ' + request + ' impossible';
        }
        this._element = element;
        this._request = request;
    }
    execute(){
        switch (this._request) {
            case 'up':
                this.putUp();
                break;
            case 'down':
                this.putDown();
                break;
            default:
                break;
        }
    }
    revert(){
        switch (this._request) {
            case 'down':
                this.putUp();
                break;
            case 'up':
                this.putDown();
                break;
            default:
                break;
        }
    }
    putDown(){
        if(this._element){
            if(this.isActiveDown()){
                var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
                Artboard.getInstance().artboard.insertBefore(Artboard.getInstance().artboard.children[index], Artboard.getInstance().artboard.children[index - 1])
            }
        }
    }
    putUp(){
        if(this._element){
            if(this.isActiveUp()){
                var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
                Artboard.getInstance().artboard.insertBefore(Artboard.getInstance().artboard.children[index + 1], Artboard.getInstance().artboard.children[index])
            }
        }
    }

    isActiveUp(){
        if(this._element){
            var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
            return index + 1 < Artboard.getInstance().artboard.childElementCount;
        }
    }

    isActiveDown(){
        if(this._element){
            var index = Array.from(Artboard.getInstance().artboard.children).indexOf(this._element);
            return index > 0 && index < Artboard.getInstance().artboard.childElementCount;
        }
    }
}
window.LayerCommand = LayerCommand;

class ResizeCommand extends Command{
    _startRect = null;
    _targetRect = null;
    _element;
    constructor(element, startRect, targetRect){
        super();
        this._element = element;
        this._startRect = startRect;
        this._targetRect = targetRect;
    }
    execute(){
        SvgUtils.setRectViaRectangle(this._element, this._targetRect);
    }
    revert(){
        SvgUtils.setRectViaRectangle(this._element, this._startRect);
    }
}
window.ResizeCommand = ResizeCommand;

class ImportationCommand extends Command {
    _element = null;
    constructor(element){
        super();
        this._element = element.cloneNode(true);
        this._element.setAttribute("class", "element");
    }
    execute(){
        Artboard.getInstance().artboard.appendChild(this._element);
        CustomElement.init(this._element);
    }
    revert(){
        Artboard.getInstance().artboard.removeChild(this._element);
    }

}
window.ImportationCommand = ImportationCommand;
class CurrentElement{
    static _selectedElement;
    static _isDragging;
    static _offset;
    static get selectedElement() {
        return this._selectedElement;
    }
    static set selectedElement(_selectedElement) {
        const attributes = document.querySelector("#attributes");
        attributes.innerHTML = "";
        if(this._selectedElement){
            this._selectedElement.removeEventListener('handler', Handler.getInstance().put);
            this._selectedElement.classList.remove("selected");
        }
        this._selectedElement = _selectedElement;
        if(this._selectedElement){
            CustomElement.init(this._selectedElement, true);
            this._selectedElement.classList.add("selected");
            new OpacityController("#attributes");
            var count = this._selectedElement.getAttribute("data-colors-count");
            count = Number(count);
            for(var i = 0; i < count; i++){
                new ColorController("#attributes", i, this._selectedElement.querySelector(`*[fill-id="${i}"`).getAttribute("fill"));
            }
        }else{
            Handler.getInstance().hide();
        }
    }
    static get isDragging () {
        return this._isDragging;
    }
    static set isDragging (_isDragging) {
        this._isDragging = _isDragging;
    }
    static get offset () {
        return this._offset;
    }
    static set offset (_offset) {
        this._offset = _offset;
    }
}

window.CurrentElement = CurrentElement;

class CustomElement{
    static init(element, selectioned = false){
        element.addEventListener('handler', Handler.getInstance().put);
        DragCommand.attachDragEvent(element);
        CustomElement._addFillAttributes(element);
        if(selectioned){
            Handler.getInstance().dispatchHandler(element);
        }
    }
    static _addFillAttributes(element){
        var existingColors = new Set();
        const fillables = element.querySelectorAll("*[fill]");
        for(const fillable of fillables){
            const color = fillable.getAttribute("fill");
            existingColors.add(color);
        }
        const tabExistingColors = Array.from(existingColors);
        element.setAttribute("data-colors-count", tabExistingColors.length);
        for(var i = 0; i < tabExistingColors.length; i++){
            const color = tabExistingColors[i];
            const currentColored = element.querySelectorAll("*[fill='" + color + "']");
            for(const current of currentColored){
                current.setAttribute("fill-id", "" + i);
            }
        }
    }
}

window.CustomElement = CustomElement;

class ChangeAttributesCommand extends Command{
    _oldValue;
    _newValue;
    _attribute;
    _elements;
    _isStyle;
    _revertCallback;
    _executeCallback;
    constructor(selector, attribute, oldValue, newValue, isStyle = false){
        super();
        if(!selector){
            this._elements = [CurrentElement.selectedElement];
        }else{
            this._elements = CurrentElement.selectedElement.querySelectorAll(selector);
        }
        this._attribute = attribute;
        this._newValue = newValue;
        this._isStyle = isStyle;
        this._oldValue = oldValue;
    }
    execute(){
        console.log(this._oldValue, this._newValue);
        if(!this._isStyle){
            for(const toChange of this._elements){
                toChange.setAttribute(this._attribute, this._newValue);
            }
        }else{
            for(const toChange of this._elements){
                toChange.style[this._attribute] = this._newValue;
            }
        }
        if(this._executeCallback && typeof this._executeCallback == "function"){
            this._executeCallback();
        }
    }
    revert(){
        if(!this._isStyle){
            for(const toChange of this._elements){
                toChange.setAttribute(this._attribute, this._oldValue);
            }
        }else{
            for(const toChange of this._elements){
                toChange.style[this._attribute] = this._oldValue;
            }
        }
        if(this._revertCallback && typeof this._revertCallback == "function"){
            this._revertCallback();
        }
    }
    setRevertCallback(callback){
        this._revertCallback = callback;
    }
    setExecuteCallback(callback){
        this._executeCallback = callback;
    }
}

window.ChangeAttributesCommand = ChangeAttributesCommand;
class Handler{
    _instance = null;
    _handler = null;
    _handleTL;
    _handleTR;
    _handleBR;
    _handleBL;
    _startRect = null;
    constructor(){
        this._handler = document.querySelector("#handler");
        this._handleTL = document.querySelector("#handle-tl");
        this._handleTR = document.querySelector("#handle-tr");
        this._handleBR = document.querySelector("#handle-br");
        this._handleBL = document.querySelector("#handle-bl");
    }
    static getInstance(){
        if(!this._instance){
            this._instance = new Handler();
            this._instance._init();
        }
        return this._instance;
    }
    _init(){
        const mouseupEventHandleTL = (event) => {  Artboard.getInstance().stackControl.do(new ResizeCommand(CurrentElement.selectedElement, this._startRect, SvgUtils.getRectOfElement(CurrentElement.selectedElement))); document.removeEventListener('mouseup', mouseupEventHandleTL);  Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleTL);}
        const mouseupEventHandleTR = (event) => {  Artboard.getInstance().stackControl.do(new ResizeCommand(CurrentElement.selectedElement, this._startRect, SvgUtils.getRectOfElement(CurrentElement.selectedElement))); document.removeEventListener('mouseup', mouseupEventHandleTR);  Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleTR);}
        const mouseupEventHandleBR = (event) => {  Artboard.getInstance().stackControl.do(new ResizeCommand(CurrentElement.selectedElement, this._startRect, SvgUtils.getRectOfElement(CurrentElement.selectedElement))); document.removeEventListener('mouseup', mouseupEventHandleBR);  Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleBR);}
        const mouseupEventHandleBL = (event) => {  Artboard.getInstance().stackControl.do(new ResizeCommand(CurrentElement.selectedElement, this._startRect, SvgUtils.getRectOfElement(CurrentElement.selectedElement))); document.removeEventListener('mouseup', mouseupEventHandleBL);  Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleBL);}
        const mousedownEventHandleTL = (event) => { if(!CurrentElement.selectedElement) return; this._startRect = SvgUtils.getRectOfElement(CurrentElement.selectedElement); document.addEventListener('mouseup', mouseupEventHandleTL); Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleTL);}
        const mousedownEventHandleTR = (event) => { if(!CurrentElement.selectedElement) return; this._startRect = SvgUtils.getRectOfElement(CurrentElement.selectedElement); document.addEventListener('mouseup', mouseupEventHandleTR); Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleTR);}
        const mousedownEventHandleBR = (event) => { if(!CurrentElement.selectedElement) return; this._startRect = SvgUtils.getRectOfElement(CurrentElement.selectedElement); document.addEventListener('mouseup', mouseupEventHandleBR); Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleBR);}
        const mousedownEventHandleBL = (event) => { if(!CurrentElement.selectedElement) return; this._startRect = SvgUtils.getRectOfElement(CurrentElement.selectedElement); document.addEventListener('mouseup', mouseupEventHandleBL); Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleBL);}
        this._handleTL.addEventListener('mousedown', mousedownEventHandleTL);
        this._handleTR.addEventListener('mousedown', mousedownEventHandleTR);
        this._handleBR.addEventListener('mousedown', mousedownEventHandleBR);
        this._handleBL.addEventListener('mousedown', mousedownEventHandleBL);
        document.querySelector("#btn-up").addEventListener('click',  (event) => {
            Artboard.getInstance().stackControl.do(new LayerCommand(CurrentElement.selectedElement, 'up'));
        })
        document.querySelector("#btn-down").addEventListener('click',  (event) => {
            Artboard.getInstance().stackControl.do(new LayerCommand(CurrentElement.selectedElement, 'down'));
        })
        document.querySelector("#btn-clone").addEventListener('click', (event) => {
            Artboard.getInstance().stackControl.do(new DuplicateCommand(CurrentElement.selectedElement));
        })
        document.querySelector("#btn-trash").addEventListener('click', (event) => {
            Artboard.getInstance().stackControl.do(new DeleteCommand(CurrentElement.selectedElement));
        } )
    }
    
    dispatchHandler(element){
        element.dispatchEvent(new CustomEvent('handler', {detail : {rectangle : SvgUtils.getRectOfElement(element)}}));
    }
    put(event){
        var {x,y,width, height} = event.detail.rectangle.toObject();
        const handler = document.querySelector("#handler");
        handler.style.left = x + "px";
        handler.style.top = y + "px";
        handler.style.width = width + "px";
        handler.style.height = height + "px";
        handler.style.display = "block";
    }
    hide(){
        this._handler.style.display = "none";
    }

    scaleBR(event){
        if(CurrentElement.selectedElement){
            event.preventDefault();
            event.stopPropagation();
            var {x,y,width, height} = SvgUtils.getRectOfElement(CurrentElement.selectedElement).toObject();
            var positionMouse = SvgUtils.getMousePosition(event);
            width = positionMouse.x - Number(x);
            height = positionMouse.y - Number(y);
            SvgUtils.setRect(CurrentElement.selectedElement, x,y,width,height);
        }
    }
    scaleTL(event){
        if(CurrentElement.selectedElement){
            event.preventDefault();
            event.stopPropagation();
            var {x,y,width, height} = SvgUtils.getRectOfElement(CurrentElement.selectedElement).toObject();
            var oldX = x;
            var oldY = y;
            var positionMouse = SvgUtils.getMousePosition(event);
            x = positionMouse.x;
            y = positionMouse.y;
            width += oldX - x;
            height += oldY - y;
            SvgUtils.setRect(CurrentElement.selectedElement, x,y,width,height);
        }
    }
    scaleTR(event){
        if(CurrentElement.selectedElement){
            event.preventDefault();
            event.stopPropagation();
            var {x,y,width, height} = SvgUtils.getRectOfElement(CurrentElement.selectedElement).toObject();
            var oldY = y;
            var positionMouse = SvgUtils.getMousePosition(event);
            y = positionMouse.y;
            width = positionMouse.x - Number(x);
            height += oldY - y;
            SvgUtils.setRect(CurrentElement.selectedElement, x,y,width,height);
        }
    }
    scaleBL(event){
        if(CurrentElement.selectedElement){
            event.preventDefault();
            event.stopPropagation();
            var {x,y,width, height} = SvgUtils.getRectOfElement(CurrentElement.selectedElement).toObject();
            var oldX = x;
            var positionMouse = SvgUtils.getMousePosition(event);
            x = positionMouse.x;
            height = positionMouse.y - Number(y);
            width += oldX - x;
            SvgUtils.setRect(CurrentElement.selectedElement, x,y,width,height);
        }
    }

}

window.Handler = Handler;

class Artboard{
    _instance = null;
    _artboard = null;
    _stackControl = null;
    static getInstance(){
        if(!this._instance){
            this._instance = new Artboard();
            this._instance._init();
        }
        return this._instance;
    }
    
    _init(){
        this._stackControl = new StackControl();
        this._artboard = document.querySelector("svg#artboard");
        this._artboard.addEventListener('click', function(event) {
            if(!ColorController.isShown){
                if(!CurrentElement.isDragging && event.currentTarget == event.target){
                    CurrentElement.selectedElement = null;
                }
            }
        })
        this._attachKeyboardEvents();
        this._attachElementEvents();
        this._attachDownloadEvents();
    }
    _attachKeyboardEvents(){
        document.addEventListener('keyup', (event) => {
            if(CurrentElement.selectedElement){
                if(event.which == 46){
                    this._stackControl.do(new DeleteCommand(CurrentElement.selectedElement));
                }
            }
        });
        document.addEventListener('keydown', (event) => {
            if(event.ctrlKey && event.key == 'z'){
                Artboard.getInstance().stackControl.back();
            }
            if(event.ctrlKey && event.key == 'y'){
                Artboard.getInstance().stackControl.forward();
            }
        })
    }
    _attachElementEvents(){
        const elements = this._artboard.querySelectorAll("svg.element");
        for(const element of elements){
            CustomElement.init(element);
        }
    }
    _attachDownloadEvents(){
        const png = document.querySelector("#btn-download-png");
        png.addEventListener('click', SvgUtils.saveIntoPng);
    }

    get artboard () {
        return this._artboard;
    }
    get stackControl () {
        return this._stackControl;
    }
}
window.Artboard = Artboard;

class OpacityController {
    _inputElement;
    _valueElement;
    _lastOpacity;
    constructor(containerSelector){
        const div = document.createElement("div");
        div.innerHTML = 
        `
            <div id="btn-group-opacity" class="btn-group">
              <button id="btn-opacity" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fa fa-adjust" style="font-size: 20px;"></i>
              </button>
              <ul class="dropdown-menu">
                <li id="opacity-container">
                    <div>
                        <div>Opacity </div>
                        <div><input id="opacity-input" type="range" value="100"></div>
                        <div id="opacity-value">100%</div>
                    </div>
                </li>
              </ul>
            </div>
        `;
        document.querySelector(containerSelector).appendChild(div);
        this._inputElement = document.querySelector("#opacity-input");
        this._valueElement = document.querySelector("#opacity-value");
        this._inputElement.addEventListener('change', (event) => {
            Artboard.getInstance().stackControl.do(new ChangeAttributesCommand(null, "opacity", this._lastOpacity, Number(event.currentTarget.value) / 100, true));
        })
        this._inputElement.addEventListener('input', (event) => {
            this._valueElement.innerHTML = event.currentTarget.value +"%";
            CurrentElement.selectedElement.style.opacity = Number(event.currentTarget.value) / 100;
        })
            
        $('#btn-group-opacity').on('show.bs.dropdown', () => {
            this._lastOpacity = CurrentElement.selectedElement.style["opacity"] ? CurrentElement.selectedElement.style["opacity"] : 1;
            var currentOpacity = Math.round(this._lastOpacity * 100);
            this._valueElement.innerHTML = currentOpacity +"%";
            this._inputElement.value = currentOpacity;
        })
    }
}
window.OpacityController = OpacityController;

class ColorController{
    _isChanged = false;
    _lastColor = null;
    static _isShown = false;
    static set isShown (value){
        this._isShown = value;
    }
    static get isShown (){
        return this._isShown;
    }
    constructor(containerSelector, num, color){
        const div = document.createElement("div");
        div.innerHTML = 
        `
        <input type="text" id="color-${num}" class="form-control color-input">
        `;
        document.querySelector(containerSelector).appendChild(div);
        const itemToColor = CurrentElement.selectedElement.querySelectorAll(`*[fill-id="${num}"]`);
        $(`#color-${num}`).spectrum({
            type: "color",
            color: color,
            show: (color) => {
                this._lastColor = color;
                ColorController.isShown = true;
            },
            change: (color) => {
                this._isChanged = true;
                var colorChanger = new ChangeAttributesCommand(`*[fill-id="${num}"]`, "fill", this._lastColor.toRgbString(), color.toRgbString());
                colorChanger.setRevertCallback(() => {
                    $(`#color-${num}`).spectrum("set", this._lastColor.toRgbString());
                })
                colorChanger.setExecuteCallback(() => {
                    $(`#color-${num}`).spectrum("set", color.toRgbString());
                })
                Artboard.getInstance().stackControl.do(colorChanger);
            },
            move: (color) => {
                for(const toChange of itemToColor){
                    toChange.setAttribute("fill", color.toRgbString());
                }
            },
            hide: (color) => {
                ColorController.isShown = false;
                if(this._isChanged){
                    this._isChanged = false;
                }else{
                    for(const toChange of itemToColor){
                        toChange.setAttribute("fill", this._lastColor.toRgbString());
                    }
                }
            }

        })
    }
}

window.ColorController = ColorController;