const axios = require('axios');
const fs = require('fs');
const retry = require('retry');
const https = require('https');
const pLimit = require('p-limit');
const EventEmitter = require('events');
const {
    urls
} = require('./url.js');

const bytes = 274938065; //文件大小
const chunkSize = 1024 * 1024; //分块下载的大小
const file = './a.bin'; //文件路径

const limit_1 = pLimit(host.length * 2);
const limit_2 = pLimit(1);

let ranges = [];
for (let i = 0; i < bytes - 1; i += chunkSize) {
    ranges.push(i);
}
//module.exports = ranges;

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

let promises_1 = [];
let promises_2 = [];
let switchs = [];
ranges.map((range) => {
    switchs.push(new Switch());
});

function connect(range) {
    return new Promise((resolve, reject) => {
        const oper = retry.operation();
        oper.attempt((c) => {
            const config = {
                method: 'GET',
                url: (urls[(range / chunkSize) % host.length]),
                headers: {
                    'User-Agent': '',
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'identity',
                    'Accept-Language': 'zh-CN',
                    'Range': `bytes=${range}-${Math.min(range + chunkSize - 1, bytes-1)}`
                },
                responseType: 'stream',
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            };
            axios.request(config).then(re => {
                const writer = fs.createWriteStream(`./cache/${range/chunkSize}.bin`);
                writer.on('finish', () => {
                    writer.close();
                    switchs[range / chunkSize].turnOn();
                    resolve();
                });
                re.data.pipe(writer);
            }).
            catch (err => oper.retry(err));
        });
    })
}

function merge(range) {
    return new Promise((resolve, reject) => {
        switchs[range / chunkSize].wait().then(() => {
            fs.readFile(`./cache/${range/chunkSize}.bin`, (err, data) => {
                if (err) {
                    reject(err);
                }
                fs.appendFile(file, data, (err) => {
                    if (err) {
                        reject(err);
                    }
                });
            });
            resolve();
        });
    })
}

function main() {
    if (fs.existsSync(file)) {
        return console.log('file exists');
    }
    if (!fs.existsSync('./cache')) {
        fs.mkdirSync('./cache', (err) => {
            if (err) {
                return console.error(err);
            }
        });
    }
    ranges.map((range) => {
        promises_1.push(limit_1(() => connection(range)));
        promises_2.push(limit_2(() => merge(range)));
    });
    console.log('working');
    Promise.all(promises_1).then(() => console.log('downloaded'));
    Promise.all(promises_2).then(() => console.log('completed'));
}
main();
