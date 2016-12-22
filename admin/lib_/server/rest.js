'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var DIR = './';
var DIR_COMMON = DIR + '../../common/';
var path = require('path');

var root = require(DIR + 'root');
var config = require(DIR + 'config');
var CloudFunc = require(DIR_COMMON + 'cloudfunc');
var markdown = require(DIR + 'markdown');

var jaguar = require('jaguar/legacy');
var onezip = require('onezip/legacy');
var flop = require('flop');
var pullout = require('pullout/legacy');
var ponse = require('ponse');
var rendy = require('rendy');
var copymitter = require('copymitter');
var json = require('jonny');
var check = require('checkup');

var isWin32 = process.platform === 'win32';

/**
 * rest interface
 *
 * @param request
 * @param response
 * @param callback
 */
module.exports = function (request, response, next) {
    var params = {
        request: request,
        response: response
    };

    check.type('next', next, 'function').check({
        request: request,
        response: response
    });

    var apiURL = CloudFunc.apiURL;
    var name = ponse.getPathName(request);
    var regExp = RegExp('^' + apiURL);
    var is = regExp.test(name);

    if (!is) return next();

    params.name = name.replace(apiURL, '') || '/';

    sendData(params, function (error, options, data) {
        params.gzip = !error;

        if (!data) {
            data = options;
            options = {};
        }

        if (options.name) params.name = options.name;

        if (options.gzip !== undefined) params.gzip = options.gzip;

        if (options.query) params.query = options.query;

        if (error) return ponse.sendError(error, params);

        ponse.send(data, params);
    });
};

/**
 * getting data on method and command
 *
 * @param params {name, method, body, requrest, response}
 */
function sendData(params, callback) {
    var p = params;
    var isMD = RegExp('^/markdown').test(p.name);

    if (isMD) return markdown(p.name, p.request, function (error, data) {
        callback(error, data);
    });

    switch (p.request.method) {
        case 'GET':
            onGET(params, callback);
            break;

        case 'PUT':
            pullout(p.request, 'string', function (error, body) {
                if (error) return callback(error);

                onPUT(p.name, body, callback);
            });
            break;
    }
}

function onGET(params, callback) {
    var cmd = void 0;
    var p = params;

    if (p.name[0] === '/') cmd = p.name.replace('/', '');

    if (/^pack/.test(cmd)) {
        cmd = cmd.replace(/^pack/, '');
        streamPack(root(cmd), p.response);
        return;
    }

    switch (cmd) {
        case '':
            p.data = json.stringify({
                info: 'Cloud Commander API v1'
            });

            callback(null, { name: 'api.json' }, p.data);
            break;

        default:
            callback({
                message: 'Not Found'
            });
            break;
    }
}

function getPackReg() {
    if (config('packer') === 'zip') return (/\.zip$/
    );

    return (/\.tar\.gz$/
    );
}

function streamPack(cmd, response) {
    var noop = function noop() {};
    var filename = cmd.replace(getPackReg(), '');
    var dir = path.dirname(filename);
    var names = [path.basename(filename)];

    operation('pack', dir, response, names, noop);
}

function onPUT(name, body, callback) {
    var cmd = void 0;

    check.type('callback', callback, 'function').check({
        name: name,
        body: body
    });

    if (name[0] === '/') cmd = name.replace('/', '');

    var files = json.parse(body);

    switch (cmd) {
        case 'mv':
            if (!files.from || !files.to) return callback(body);

            if (isRootAll([files.to, files.from])) return callback(getWin32RootMsg());

            files.from = root(files.from);
            files.to = root(files.to);

            copyFiles(files, flop.move, function (error) {
                var data = !files.names ? files : files.names.slice();
                var msg = formatMsg('move', data);

                callback(error, msg);
            });

            break;

        case 'cp':
            if (!files.from || !files.names || !files.to) return callback(body);

            if (isRootAll([files.to, files.from])) return callback(getWin32RootMsg());

            files.from = root(files.from);
            files.to = root(files.to);

            copy(files.from, files.to, files.names, function (error) {
                var msg = formatMsg('copy', files.names);
                callback(error, msg);
            });
            break;

        case 'pack':
            if (!files.from) return callback(body);

            pack(files.from, files.to, files.names, callback);
            break;

        case 'extract':
            if (!files.from) return callback(body);

            extract(files.from, files.to, callback);

            break;

        default:
            callback();
            break;
    }
}

function pack(from, to, names, fn) {
    from = root(from);
    to = root(to);

    if (!names) {
        names = [path.basename(from)];

        from = path.dirname(from);
    }

    operation('pack', from, to, names, fn);
}

function extract(from, to, fn) {
    from = root(from);

    if (to) to = root(to);else to = from.replace(/\.tar\.gz$/, '');

    operation('extract', from, to, fn);
}

function getPacker() {
    if (config('packer') === 'zip') return onezip;

    return jaguar;
}

function operation(op, from, to, names, fn) {
    if (!fn) {
        fn = names;
        names = [path.basename(from)];
    }

    var packer = getPacker()[op](from, to, names);

    packer.on('error', function (error) {
        fn(error);
    });

    packer.on('progress', function (count) {
        process.stdout.write(rendy('\r{{ operation }} "{{ name }}": {{ count }}%', {
            operation: op,
            name: names[0],
            count: count
        }));
    });

    packer.on('end', function () {
        process.stdout.write('\n');

        var name = path.basename(from);
        var msg = formatMsg(op, name);

        fn(null, msg);
    });
}

function copy(from, to, names, fn) {
    var error = void 0;
    var cp = copymitter(from, to, names);

    cp.on('error', function (e) {
        error = e;
        cp.abort();
    });

    cp.on('progress', function (count) {
        process.stdout.write('\r copy ' + from + ' ' + to + ' ' + count + '%');
    });

    cp.on('end', function () {
        process.stdout.write('\n');
        fn(error);
    });
}

function copyFiles(files, processFunc, callback) {
    var names = files.names;

    var copy = function copy() {
        var isLast = void 0;
        var name = void 0;
        var from = files.from;
        var to = files.to;

        if (names) {
            isLast = !names.length;
            name = names.shift();
            from += name;
            to += name;
        } else {
            isLast = false;
            names = [];
        }

        if (isLast) return callback();

        processFunc(from, to, function (error) {
            if (error) return callback(error);

            copy();
        });
    };

    check.type('callback', callback, 'function').type('processFunc', processFunc, 'function').check({
        files: files
    });

    copy();
}

function isRootWin32(path) {
    var isRoot = path === '/';
    var isConfig = config('root') === '/';

    return isWin32 && isRoot && isConfig;
}

function isRootAll(names) {
    return names.some(function (name) {
        return isRootWin32(name);
    });
}

function getWin32RootMsg() {
    var message = 'Could not copy from/to root on windows!';
    var error = Error(message);

    return error;
}

function formatMsg(msgParam, dataParam, status) {
    var data = void 0;
    var isObj = (typeof dataParam === 'undefined' ? 'undefined' : _typeof(dataParam)) === 'object';

    if (isObj) data = json.stringify(dataParam);else data = dataParam;

    return CloudFunc.formatMsg(msgParam, data, status);
}