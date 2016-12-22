'use strict';

var net = require('net');
var repl = require('repl');

module.exports = net.createServer(function (socket) {
    var pid = process.pid;
    var addr = socket.remoteAddress;
    var port = socket.remotePort;

    var r = repl.start({
        prompt: '[' + pid + ' ' + addr + ':' + port + '>',
        input: socket,
        output: socket,
        terminal: true,
        useGlobal: false
    });

    r.on('exit', function () {
        socket.end();
    });

    r.context.socket = socket;
}).listen(1337);