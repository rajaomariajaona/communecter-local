


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
        var CTM = artboard.getScreenCTM();
        return {
          x: (event.clientX - CTM.e) / CTM.a,
          y: (event.clientY - CTM.f) / CTM.d
        };
    }
}


class StackControl {
    commands = [];
    deletedCommands = [];
    do(command){
        this.deletedCommands = [];
        this.commands.push(command);
        command.execute();
    }
    forward(){
        if(this.canForward()){
            const lastCommand = this.deletedCommands.pop();
            this.commands.push(lastCommand);
            lastCommand.execute();
        }
    }
    back(){
        if(this.canBack()){
            const lastCommand = this.commands.pop();
            this.deletedCommands.push(lastCommand);
            lastCommand.revert();
        }
    }
    canForward(){
        return this.deletedCommands.length > 0;
    }
    canBack(){
        return this.commands.length > 0;
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
}
window.DragCommand = DragCommand;

class DuplicateCommand extends Command{
    _element;
    _duplicatedElement;
    _artboard;
    constructor(element, artboard){
        super();
        this._artboard = artboard;
        this._element = element;
        this._duplicatedElement = element.cloneNode(true);
    }
    execute(){
        var index = Array.from(this._artboard.children).indexOf(this._element);
        if(index != this._artboard.childElementCount - 1){
            this._artboard.insertBefore(this._duplicatedElement, this._artboard.children[index + 1]);
        }else{
            this._artboard.appendChild(this._duplicatedElement);
        }
        var {x,y} = SvgUtils.getRectOfElement(this._element).toObject();
        x += 100;
        y += 100;
        SvgUtils.setPoint(this._duplicatedElement,new Point(x,y),false);
        CurrentElement.selectedElement = this._duplicatedElement;
    }
    revert(){
        this._artboard.removeChild(this._duplicatedElement);
        if(CurrentElement.selectedElement == this._duplicatedElement){
            Handler.getInstance().hide();
        }
    }
}
window.DuplicateCommand = DuplicateCommand;



class CurrentElement{
    static _selectedElement;
    static get selectedElement() {
        return this._selectedElement;
    }
    static set selectedElement(_selectedElement) {
        if(this._selectedElement){
            this._selectedElement.removeEventListener('handler', (event) => Handler.getInstance().put(event));
        }
        this._selectedElement = _selectedElement;
        if(this._selectedElement){
            this._selectedElement.addEventListener('handler', (event) => Handler.getInstance().put(event));
            Handler.getInstance().dispatchHandler(this._selectedElement)
        }
    }
}

window.CurrentElement = CurrentElement;

class Handler{
    _instance = null;
    _handler = null;
    _handleTL;
    _handleTR;
    _handleBR;
    _handleBL;
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
        this._handleTL.addEventListener('mousedown', function(event) { document.addEventListener('mouseup', function(event) {   artboard.removeEventListener('mousemove', Handler.getInstance().scaleTL);}); artboard.addEventListener('mousemove', Handler.getInstance().scaleTL);})
        this._handleTR.addEventListener('mousedown', function(event) { document.addEventListener('mouseup', function(event) {   artboard.removeEventListener('mousemove', Handler.getInstance().scaleTR);}); artboard.addEventListener('mousemove', Handler.getInstance().scaleTR);})
        this._handleBR.addEventListener('mousedown', function(event) { document.addEventListener('mouseup', function(event) {   artboard.removeEventListener('mousemove', Handler.getInstance().scaleBR);}); artboard.addEventListener('mousemove', Handler.getInstance().scaleBR);})
        this._handleBL.addEventListener('mousedown', function(event) { document.addEventListener('mouseup', function(event) {   artboard.removeEventListener('mousemove', Handler.getInstance().scaleBL);}); artboard.addEventListener('mousemove', Handler.getInstance().scaleBL);})
    }
    dispatchHandler(element){
        element.dispatchEvent(new CustomEvent('handler', {detail : {rectangle : SvgUtils.getRectOfElement(element)}}));
    }
    put(event){
        var {x,y,width, height} = event.detail.rectangle.toObject();
        this._handler.style.left = x + "px";
        this._handler.style.top = y + "px";
        this._handler.style.width = width + "px";
        this._handler.style.height = height + "px";
        this._handler.style.display = "block";
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