var fs = require('fs');

var browserify = require('browserify');
var watchify = require('watchify');

var compressAttributes = require('./compress_attributes');
var appendVersion = require('./append_version');
var formatBundleMsg = require('./format_bundle_msg');
var constants = require('./constants');

/**
 * Make a plotly.js browserify bundle function watched by watchify.
 *
 * @param {function} onFirstBundleCallback executed when first bundle is completed
 *
 */
module.exports = function makeWatchifiedBundle(onFirstBundleCallback) {
    var b = browserify(constants.pathToPlotlySrc, {
        debug: true,
        standalone: 'Plotly',
        transform: [compressAttributes],
        cache: {},
        packageCache: {},
        plugin: [watchify]
    });

    var firstBundle = true;

    if(firstBundle) {
        console.log([
            '***',
            'Building the first bundle, this should take ~10 seconds',
            '***\n'
        ].join(' '));
    }

    b.on('update', bundle);
    formatBundleMsg(b, 'plotly.js');

    function bundle() {
        b.bundle(function(err) {
            if(err) console.error(JSON.stringify(String(err)));

            if(firstBundle) {
                onFirstBundleCallback();
                firstBundle = false;
            }
        })
        .pipe(
            fs.createWriteStream(constants.pathToPlotlyDist)
        )
        .on('finish', function() {
            appendVersion(constants.pathToPlotlyDist, {object: 'Plotly', DEV: true});
        });
    }

    return bundle;
};
