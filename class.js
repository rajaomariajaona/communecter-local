class Counter {
    _i = 0;
    add() {
        return ++this._i;
    }
    sub() {
        return --this._i;
    }
    get i() {
        return this._i
    }
}