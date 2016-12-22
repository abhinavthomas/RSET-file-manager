'use strict';

var DIR = __dirname + '/../../';
var DIR_TMPL = DIR + 'tmpl/';
var DIR_HTML = DIR + 'html/';
var DIR_COMMON = DIR + 'common/';
var DIR_JSON = DIR + 'json/';
var DIR_SERVER = __dirname + '/';
var DIR_FS = DIR_TMPL + 'fs/';

var fs = require('fs');

var flop = require('flop');
var ponse = require('ponse');
var files = require('files-io');
var rendy = require('rendy');
var exec = require('execon');
var minify = require('minify');
var format = require('format-io');
var squad = require('squad');
var apart = require('apart');

var config = require(DIR_SERVER + 'config');
var root = require(DIR_SERVER + 'root');
var prefixer = require(DIR_SERVER + 'prefixer');
var prefix = squad(prefixer, apart(config, 'prefix'));
var CloudFunc = require(DIR_COMMON + 'cloudfunc');

var PATH_INDEX = DIR_HTML + 'index.html';

var TMPL_PATH = ['file', 'panel', 'path', 'pathLink', 'link'];

var Template = {};
var FS = CloudFunc.FS;

var CSS_URL = require(DIR_JSON + 'css.json').map(function (name) {
    return 'css/' + name + '.css';
}).join(':');

module.exports = function (req, res, next) {
    check(req, res, next);

    readFiles(function () {
        route(req, res, next);
    });
};

/**
 * additional processing of index file
 */
function indexProcessing(options) {
    var from = void 0;
    var to = void 0;
    var left = '';
    var right = '';
    var keysPanel = '<div id="js-keyspanel" class="{{ className }}';
    var isOnePanel = config('onePanelMode');
    var noConfig = !config('configDialog');
    var noConsole = !config('console');
    var panel = options.panel;

    var data = options.data;

    if (!config('showKeysPanel')) {
        from = rendy(keysPanel, {
            className: 'keyspanel'
        });

        to = rendy(keysPanel, {
            className: 'keyspanel hidden'
        });

        data = data.replace(from, to);
    }

    if (isOnePanel) data = data.replace('icon-move', 'icon-move none').replace('icon-copy', 'icon-copy none');

    if (noConfig) data = data.replace('icon-config', 'icon-config none');

    if (noConsole) data = data.replace('icon-console', 'icon-console none');

    left = rendy(Template.panel, {
        side: 'left',
        content: panel,
        className: !isOnePanel ? '' : 'panel-single'
    });

    if (!isOnePanel) right = rendy(Template.panel, {
        side: 'right',
        content: panel,
        className: ''
    });

    data = rendy(data, {
        title: CloudFunc.getTitle(),
        fm: left + right,
        prefix: prefix(),
        css: CSS_URL
    });

    return data;
}

function readFiles(callback) {
    var paths = {};
    var lengthTmpl = Object.keys(Template).length;
    var lenthPath = TMPL_PATH.length;
    var isRead = lengthTmpl === lenthPath;

    if (typeof callback !== 'function') throw Error('callback should be a function!');

    if (isRead) return callback();

    var filesList = TMPL_PATH.map(function (name) {
        var path = DIR_FS + name + '.hbs';

        paths[path] = name;

        return path;
    });

    files.read(filesList, 'utf8', function (error, files) {
        if (error) throw error;

        Object.keys(files).forEach(function (path) {
            var name = paths[path];

            Template[name] = files[path];
        });

        callback();
    });
}

/**
 * routing of server queries
 */
function route(request, response, callback) {
    var name = ponse.getPathName(request);

    var isAuth = RegExp('^(/auth|/auth/github)$').test(name);
    var isFS = RegExp('^/$|^' + FS).test(name);
    var p = {
        request: request,
        response: response,
        gzip: true,
        name: name
    };

    if (!isAuth && !isFS) return callback();

    if (isAuth) {
        p.name = DIR_HTML + name + '.html';
        ponse.sendFile(p);
        return;
    }

    if (!isFS) return;

    name = name.replace(CloudFunc.FS, '') || '/';
    var fullPath = root(name);

    flop.read(fullPath, function (error, dir) {
        if (dir) dir.path = format.addSlashToEnd(name);

        if (!error) return buildIndex(dir, function (error, data) {
            p.name = PATH_INDEX;

            if (error) return ponse.sendError(error, p);

            ponse.send(data, p);
        });

        if (error.code !== 'ENOTDIR') return ponse.sendError(error, p);

        fs.realpath(fullPath, function (error, pathReal) {
            if (!error) p.name = pathReal;else p.name = name;

            p.gzip = false;
            ponse.sendFile(p);
        });
    });
}

function buildIndex(json, callback) {
    var isMinify = config('minify');

    exec.if(!isMinify, function (error, name) {
        fs.readFile(name || PATH_INDEX, 'utf8', function (error, template) {
            if (error) return;

            var panel = CloudFunc.buildFromJSON({
                data: json,
                prefix: prefix(),
                template: Template
            });

            var data = indexProcessing({
                panel: panel,
                data: template
            });

            callback(error, data);
        });
    }, function (callback) {
        minify(PATH_INDEX, 'name', callback);
    });
}

function check(req, res, next) {
    if (!req) throw Error('req could not be empty!');

    if (!res) throw Error('res could not be empty!');

    if (typeof next !== 'function') throw Error('next should be function!');
}