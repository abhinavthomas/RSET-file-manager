'use strict';

var DIR_ROOT = __dirname + '/../../';
var fs = require('fs');

var pullout = require('pullout/legacy');
var ponse = require('ponse');
var markdown = require('markdown-it')();

var root = require('./root');

module.exports = function (name, request, callback) {
    var method = request.method;
    var query = ponse.getQuery(request);

    check(name, request, callback);

    switch (method) {
        case 'GET':
            name = name.replace('/markdown', '');

            if (query === 'relative') name = DIR_ROOT + name;else name = root(name);

            fs.readFile(name, 'utf8', function (error, data) {
                if (error) return callback(error);

                parse(data, callback);
            });
            break;

        case 'PUT':
            pullout(request, 'string', function (error, data) {
                if (error) return callback(error);

                parse(data, callback);
            });
            break;
    }
};

function parse(data, callback) {
    process.nextTick(function () {
        var md = markdown.render(data);

        callback(null, md);
    });
}

function check(name, request, callback) {
    if (typeof name !== 'string') throw Error('name should be string!');

    if (!request) throw Error('request could not be empty!');

    if (typeof callback !== 'function') throw Error('callback should be function!');
}