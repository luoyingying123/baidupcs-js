class Switch {
    constructor() {
        this.isOn = false;
        this.waiters = [];
    }

    turnOn() {
        this.isOn = true;
        this.waiters.forEach(resolve => resolve());
        this.waiters = [];
    }

    turnOff() {
        this.isOn = false;
    }

    wait() {
        if (this.isOn) return Promise.resolve();
        return new Promise(resolve => this.waiters.push(resolve));
    }
}

const s = new Switch();
s.wait().then(() => console.log('the switch is on'));



const EventEmitter = require('events');

class Switch extends EventEmitter {
    constructor() {
        super();
        this.isOn = false;
    }

    turnOn() {
        this.isOn = true;
        this.emit('on');
    }

    turnOff() {
        this.isOn = false;
    }

    wait() {
        if (this.isOn) return Promise.resolve();
        return new Promise(resolve => this.once('on', resolve));
    }
}

const s = new Switch();
s.wait().then(() => console.log('the switch is on'));