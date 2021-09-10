


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
            artboard.insertBefore(artboard.children[index + 1], element);
        }
    }
}


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
            stackControl.do(new DragCommand(CurrentElement.selectedElement, startDragPoint, new Point(x,y)));
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
        x += 100;
        y += 100;
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
        if(this._position > 0){
            Artboard.getInstance().artboard.removeChild(this._element);
            if(CurrentElement.selectedElement == this._element){
                CurrentElement.selectedElement = null;
            }
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

}
window.ResizeCommand = ResizeCommand;

class CurrentElement{
    static _selectedElement;
    static _isDragging;
    static _offset;
    static get selectedElement() {
        return this._selectedElement;
    }
    static set selectedElement(_selectedElement) {
        if(this._selectedElement){
            this._selectedElement.removeEventListener('handler', Handler.getInstance().put);
        }
        this._selectedElement = _selectedElement;
        if(this._selectedElement){
            CustomElement.init(this._selectedElement, true);
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
        if(selectioned){
            Handler.getInstance().dispatchHandler(element);
        }
    }
}

window.CustomElement = CustomElement;

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
        this._handleTL.addEventListener('mousedown', function(event) { document.addEventListener('mouseup', function(event) {   Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleTL);}); Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleTL);})
        this._handleTR.addEventListener('mousedown', function(event) { document.addEventListener('mouseup', function(event) {   Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleTR);}); Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleTR);})
        this._handleBR.addEventListener('mousedown', function(event) { document.addEventListener('mouseup', function(event) {   Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleBR);}); Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleBR);})
        this._handleBL.addEventListener('mousedown', function(event) { document.addEventListener('mouseup', function(event) {   Artboard.getInstance().artboard.removeEventListener('mousemove', Handler.getInstance().scaleBL);}); Artboard.getInstance().artboard.addEventListener('mousemove', Handler.getInstance().scaleBL);})
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
    static getInstance(){
        if(!this._instance){
            this._instance = new Artboard();
            this._instance._init();
        }
        return this._instance;
    }
    
    _init(){
        this._artboard = document.querySelector("svg#artboard");
        this._artboard.addEventListener('click', function(event) {
            if(!CurrentElement.isDragging && event.currentTarget == event.target){
                CurrentElement.selectedElement = null;
            }
        })
        this._attachKeyboardEvents();
        this._attachElementEvents();
    }
    _attachKeyboardEvents(){
        document.addEventListener('keyup', function(event){
            if(CurrentElement.selectedElement){
                if(event.which == 46){
                    remove();
                }
            }
        });
    }
    _attachElementEvents(){
        const elements = this._artboard.querySelectorAll("svg.element");
        for(const element of elements){
            CustomElement.init(element);
        }
    }

    get artboard () {
        return this._artboard;
    }

}