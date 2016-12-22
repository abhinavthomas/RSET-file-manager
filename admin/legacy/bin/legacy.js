#!/usr/bin/env node


'use strict';

var fs = require('fs');
var path = require('path');

var dir = path.join(__dirname, '../lib/server');
var _dir = path.join(__dirname, '../legacy/lib/server');

var setDir = function setDir(name) {
    return path.join(_dir, name);
};

fs.readdirSync(dir).map(fillFile).map(writeFile);

function fillFile(name) {
    return {
        name: setDir(name),
        data: 'module.exports = require(\'../../../lib_/server/' + name + '\');'
    };
}

function writeFile(_ref) {
    var name = _ref.name,
        data = _ref.data;

    return fs.writeFileSync(name, data);
}