'use strict';

var DIR_LIB = './';
var DIR_SERVER = DIR_LIB + 'server/';

var cloudcmd = require(DIR_LIB + 'cloudcmd');

var exit = require(DIR_SERVER + 'exit');
var config = require(DIR_SERVER + 'config');
var prefixer = require(DIR_SERVER + 'prefixer');

var http = require('http');
var opn = require('opn');
var express = require('express');
var io = require('socket.io');
var squad = require('squad');
var apart = require('apart');

var tryRequire = require('tryrequire');
var logger = tryRequire('morgan');

var prefix = squad(prefixer, apart(config, 'prefix'));

module.exports = function (options) {
    var port = process.env.PORT || /* c9           */
    process.env.VCAP_APP_PORT || /* cloudfoundry */
    config('port');

    var ip = process.env.IP || /* c9           */
    config('ip') || '0.0.0.0';

    var app = express();
    var server = http.createServer(app);

    if (logger) app.use(logger('dev'));

    app.use(cloudcmd({
        config: options,
        socket: io(server, {
            path: prefix() + '/socket.io'
        })
    }));

    if (port < 0 || port > 65535) exit('cloudcmd --port: %s', 'port number could be 1..65535, 0 means any available port');

    server.listen(port, ip, function () {
        var host = config('ip') || 'localhost';
        var port0 = port || server.address().port;
        var url = 'http://' + host + ':' + port0 + prefix() + '/';

        console.log('url:', url);

        if (!config('open')) return;

        opn(url);
    });

    server.on('error', function (error) {
        exit('cloudcmd --port: %s', error.message);
    });
};