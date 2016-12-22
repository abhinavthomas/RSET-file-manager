#!/usr/bin/env node


'use strict';

var Info = require('../package');
var DIR_SERVER = '../lib/server/';

var exit = require(DIR_SERVER + 'exit');
var config = require(DIR_SERVER + 'config');

var argv = process.argv;
var args = require('minimist')(argv.slice(2), {
    string: ['port', 'password', 'username', 'config', 'editor', 'packer', 'root', 'prefix'],
    boolean: ['auth', 'repl', 'save', 'server', 'online', 'open', 'minify', 'progress', 'config-dialog', 'console', 'one-panel-mode', 'html-dialogs'],
    default: {
        server: true,
        auth: config('auth'),
        port: config('port'),
        minify: config('minify'),
        online: config('online'),
        open: config('open'),
        editor: config('editor') || 'edward',
        packer: config('packer') || 'tar',
        zip: config('zip'),
        username: config('username'),
        root: config('root') || '/',
        prefix: config('prefix') || '',
        progress: config('progress'),
        console: config('console'),

        'config-dialog': config('configDialog'),
        'one-panel-mode': config('onePanelMode'),
        'html-dialogs': config('htmlDialogs')
    },
    alias: {
        v: 'version',
        h: 'help',
        p: 'password',
        o: 'online',
        u: 'username',
        s: 'save',
        a: 'auth',
        c: 'config'
    },
    unknown: function unknown(cmd) {
        exit('\'%s\' is not a cloudcmd option. See \'cloudcmd --help\'.', cmd);
    }
});

if (args.version) {
    version();
} else if (args.help) {
    help();
} else {
    (function () {
        if (args.repl) repl();

        checkUpdate();

        port(args.port);

        config('auth', args.auth);
        config('online', args.online);
        config('open', args.open);
        config('minify', args.minify);
        config('username', args.username);
        config('progress', args.progress);
        config('console', args.console);
        config('prefix', args.prefix);
        config('root', args.root);
        config('htmlDialogs', args['html-dialogs']);
        config('onePanelMode', args['one-panel-mode']);
        config('configDialog', args['config-dialog']);

        readConfig(args.config);

        var options = {
            root: args.root || '/', /* --no-root */
            editor: args.editor,
            packer: args.packer,
            prefix: args.prefix
        };

        if (args.password) config('password', getPassword(args.password));

        validateRoot(options.root);

        if (!args.save) start(options);else config.save(function () {
            start(options);
        });
    })();
}

function validateRoot(root) {
    var validate = require(DIR_SERVER + 'validate');
    validate.root(root, console.log);
}

function getPassword(password) {
    var criton = require('criton');

    return criton(password, config('algo'));
}

function version() {
    console.log('v' + Info.version);
}

function start(config) {
    var SERVER = '../lib/server';

    if (args.server) require(SERVER)(config);
}

function port(arg) {
    var number = parseInt(arg, 10);

    if (!isNaN(number)) config('port', number);else exit('cloudcmd --port: should be a number');
}

function readConfig(name) {
    if (!name) return;

    var tryCatch = require('try-catch');
    var readjson = require('readjson');

    var data = void 0;

    var error = tryCatch(function () {
        data = readjson.sync(name);
    });

    if (error) return exit(error.message);

    Object.keys(data).forEach(function (item) {
        config(item, data[item]);
    });
}

function help() {
    var bin = require('../json/help');
    var usage = 'Usage: cloudcmd [options]';
    var url = Info.homepage;

    console.log(usage);
    console.log('Options:');

    Object.keys(bin).forEach(function (name) {
        console.log('  %s %s', name, bin[name]);
    });

    console.log('\nGeneral help using Cloud Commander: <%s>', url);
}

function repl() {
    console.log('REPL mode enabled (telnet localhost 1337)');
    require(DIR_SERVER + 'repl');
}

function checkUpdate() {
    var load = require('package-json');
    var chalk = require('chalk');
    var rendy = require('rendy');

    load(Info.name, 'latest').then(function (data) {
        var version = data.version;

        if (version !== Info.version) {
            var latest = rendy('update available: {{ latest }}', {
                latest: chalk.green.bold('v' + version)
            });

            var current = chalk.dim(rendy('(current: v{{ current }})', {
                current: Info.version
            }));

            console.log('%s %s', latest, current);
        }
    });
}