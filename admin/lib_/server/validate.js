'use strict';

var exit = require('./exit');

module.exports.root = root;
module.exports.editor = editor;
module.exports.packer = packer;

function root(dir, fn) {
    if (typeof dir !== 'string') throw Error('dir should be a string');

    if (dir === '/') return;

    var fs = require('fs');

    fs.stat(dir, function (error) {
        if (error) return exit('cloudcmd --root: %s', error.message);

        if (typeof fn === 'function') fn('root:', dir);
    });
}

function editor(name) {
    var reg = /^(dword|edward|deepword)$/;

    if (!reg.test(name)) exit('cloudcmd --editor: could be "dword", "edward" or "deepword" only');
}

function packer(name) {
    var reg = /^(tar|zip)$/;

    if (!reg.test(name)) exit('cloudcmd --packer: could be "tar" or "zip" only');
}