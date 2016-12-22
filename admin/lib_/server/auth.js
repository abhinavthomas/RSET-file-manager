'use strict';

var httpAuth = require('http-auth');
var criton = require('criton');

var config = require('./config');

module.exports = function () {
    var auth = httpAuth.basic({
        realm: 'Cloud Commander'
    }, check);

    return middle(auth);
};

function middle(authentication) {
    return function (req, res, next) {
        var is = config('auth');

        if (!is) return next();

        var success = function success() {
            return next();
        };
        authentication.check(req, res, success);
    };
}

function check(username, password, callback) {
    var BAD_CREDENTIALS = false;
    var name = config('username');
    var pass = config('password');
    var algo = config('algo');

    if (!password) return callback(BAD_CREDENTIALS);

    var sameName = username === name;
    var samePass = pass === criton(password, algo);

    callback(sameName && samePass);
}