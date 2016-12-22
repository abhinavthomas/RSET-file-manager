#!/usr/bin/env node


'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var DIR = '../';
var Info = require(DIR + 'package');

var minor = require('minor');
var place = require('place');
var rendy = require('rendy');
var shortdate = require('shortdate');

var ERROR = Error('ERROR: version is missing. release --patch|--minor|--major');

main(function (error) {
    if (error) console.error(error.message);
});

function main(callback) {
    var history = 'Version history\n---------------\n';
    var link = '//github.com/coderaiser/cloudcmd/releases/tag/';
    var template = '- *{{ date }}*, ' + '**[v{{ version }}]' + '(' + link + 'v{{ version }})**\n';

    var version = Info.version;

    cl(function (error, versionNew) {
        if (error) {
            callback(error);
        } else {
            replaceVersion('README.md', version, versionNew, callback);
            replaceVersion('HELP.md', version, versionNew, function () {
                var historyNew = history + rendy(template, {
                    date: shortdate(),
                    version: versionNew
                });

                replaceVersion('HELP.md', history, historyNew, callback);
            });
        }
    });
}

function replaceVersion(name, version, versionNew, callback) {
    place(name, version, versionNew, function (error) {
        var msg = void 0;

        if (!error) msg = 'done: ' + name;

        callback(error, msg);
    });
}

function cl(callback) {
    var argv = process.argv;
    var length = argv.length - 1;
    var last = process.argv[length];
    var regExp = /^--(major|minor|patch)$/;

    var _ref = last.match(regExp) || [],
        _ref2 = _slicedToArray(_ref, 2),
        match = _ref2[1];

    var error = void 0;
    var versionNew = void 0;

    if (!regExp.test(last)) error = ERROR;else if (match) versionNew = minor(match, Info.version);else versionNew = last.substr(3);

    callback(error, versionNew);
}