'use strict';

module.exports = function (value) {
    if (typeof value !== 'string') return value;

    if (value && !~value.indexOf('/')) return '/' + value;

    if (value.length === 1) return '';

    return value;
};