


class SvgUtils {
    static setPoint(element, point, fire = true){
        element.setAttribute('x', point.x)
        element.setAttribute('y', point.y)
        if(fire){
            Handler.dispatchHandler(element);
        }
    }
    static setRect(element, x,y,width,height){
        SvgUtils.setRectViaRectangle(element, Rectangle.fromXY(x,y,width,height));
    }
    static setRectViaRectangle(element, rect){
        SvgUtils.setPoint(element, rect.point, false);
        element.setAttribute('width', rect.width);
        element.setAttribute('height', rect.height);
        Handler.dispatchHandler(element);
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
            Handler.dispatchHandler(element);
        }
        return Rectangle.fromXY(x,y,width, height);
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
            this._selectedElement.removeEventListener('handler', Handler.put);
        }
        this._selectedElement = _selectedElement;
        if(this._selectedElement){
            this._selectedElement.addEventListener('handler', Handler.put);
        }
    }
}

window.CurrentElement = CurrentElement;

class Handler{
    static dispatchHandler(element){
        element.dispatchEvent(new CustomEvent('handler', {detail : {rectangle : SvgUtils.getRectOfElement(element)}}));
    }
    static put(event){
        const handler = document.querySelector("#handler");
        var {x,y,width, height} = event.detail.rectangle.toObject();
        handler.style.left = x + "px";
        handler.style.top = y + "px";
        handler.style.width = width + "px";
        handler.style.height = height + "px";
        handler.style.display = "block";
    }
    static hide(){
        const handler = document.querySelector("#handler");
        handler.style.display = "none";
    }
}

window.Handler = Handler;