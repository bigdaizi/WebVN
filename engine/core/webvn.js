/* The namespace of the game engine: webvn.
 * All different parts of the engine should be defined within it.
 */

var webvn = (function (undefined) {

var s = {};

// version number
s.VERSION = '0.0.1';

return s;

})();

/* Simple loader
 * Also defines a simple function to add modules 
 */

(function (s) {

var loader = {};

// Used to append script tag
var head = document.getElementsByTagName('head')[0],
// Prefix of all url
    prefix = '',
// Container of all scripts
    scriptList = [],
// Function called when all scripts are loaded
    onReady = {},
// Callback when all scripts loaded
    allReady = null,
// Whether is loading script
    isScriptLoading = false;

// Set prefix of the url
loader.prefix = function (pre) {

    prefix = pre;

    return loader;

};

// Trigger when all scripts are loaded
loader.ready = function (fn) {

    allReady = fn;

};

loader.readyTrigger = function () {

    if (allReady) {
        allReady();
        allReady = null;
    }

}

// Load css
loader.css = function (css) {

    if (!isArray(css)) {
        css = [css];
    }

    for (var i = 0, len = css.length; i < len; i++) {
        loadCss(prefix + css[i] + '.css');
    }

    return loader;

}

/* Load scripts
 * Param script can be either a string or an array.
 */
loader.script = function (scripts) {

    // Turn scripts into an array if it is not.
    if (!isArray(scripts)) {
        scripts = [scripts];
    }

    // Push scripts into container and excute them
    for (var i = 0, len = scripts.length; i < len; i++) {
        scriptList.push(prefix + scripts[i] + '.js');
    }

    if (isScriptLoading === false) {
        loadScript();
    }

    return loader;

};

loader.wait = function (fn) {

    var last = scriptList[scriptList.length - 1];
    if (last) {
        onReady[last] = fn;
    }

};

// Private methods

function isArray(arr) {

    return Object.prototype.toString.call(arr) == '[object Array]';

}

// Load Css file
function loadCss(href) {

    var link = document.createElement('link');

    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', href);

    head.appendChild(link);

}

// Load scripts one by one until there is nothing left.
function loadScript() {

    if (scriptList.length === 0) {
        return;
    }

    isScriptLoading = true;

    var script = document.createElement('script'),
        scriptName;

    script.src = scriptName = scriptList[0];
    script.onload = function () {

        isScriptLoading = false;

        if (script.readyState && 
            script.readyState != "complete" &&
            script.readyState != "loaded") {
            return;
        }

        scriptList.shift();

        loadScript();

        if (onReady[scriptName]) {
            onReady[scriptName]();
            onReady[scriptName] = null;
        }

    };

    head.appendChild(script);

}

s.loader = loader;

/* name: the name of the module
 * requires: other module reference
 * module: function that acturally creates the module
 */
s.add = function (name, requires, module) {

    if (s[name]) {
        console.error('The module already exists');
        return;
    }

    if (typeof requires === 'function') {
        module = requires;
        requires = [];
    }

    try {
        requires = getModules(requires);
    } catch (e) {
        console.error(e);
    }

    // The first param that parsed is the webvn global namespace
    requires.unshift(s);
    s[name] = module.apply(null, requires);

    if (s[name]) {
        console.info('Module ' + name + ' loaded');
    } else {
        console.error('Failed to create module ' + name);
    }

};

// Making it easier use different parts of the webvn
s.use = function (requires, module) {

    try {
        requires = getModules(requires);
    } catch (e) {
        console.error(e);
    }

    requires.unshift(s);

    module.apply(null, requires);

};

// Change the name of the requires to be actual functions.
function getModules(requires) {

    for (var i = 0, len = requires.length; i < len; i++) {
        if (s[requires[i]]) {
            requires[i] = s[requires[i]];
        } else {
            throw new Error('Module ' + requires[i] + " does'nt exist");
        }
    }

    return requires;

}

})(webvn);

// Look for config file and load some scripts
(function (s) {

var loader = s.loader,
    script, dataMain,
    scripts = document.getElementsByTagName('script');

for (i = scripts.length - 1; i > -1; i--) {
    if (scripts[i]) {
        script = scripts[i];
        dataMain = script.getAttribute('data-config');
        if (dataMain) {
            break;
        }
    }
}

if (dataMain) {
    loader.script(dataMain).
        wait(function () {
        var config = window.config,
            loadFiles = config.loadFiles,
            css = loadFiles.css,
            js = loadFiles.js,
            prefix = loadFiles.prefix;
        loader.prefix(prefix.css.ui).css(css.ui).
            prefix(prefix.js.core).script(js.core).
            prefix(prefix.js.lib).script(js.lib).
            prefix(prefix.js.ui).script(js.ui).
            prefix(prefix.js.cmd).script(js.cmd).wait(function () {
                loader.readyTrigger();
            });

    });
} else {
    console.error("Failed to load configuration");
}

})(webvn)