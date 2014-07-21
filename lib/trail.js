
var fs = require('fs');
var Paths = require('./paths');
var Extensions = require('./extensions');
var Aliases = require('./aliases');

module.exports.Trail = function Trail(root) {
  if (!(this instanceof Trail)) {
    return new Trail(options);
  }

  this._root = root;
  this._extensions = [];
  this._paths = [];
  this._aliases = {};
}

var T = module.exports.prototype

T.find = function(paths, options, func) {
  return this.find_all(paths, options, func)[0];
}

T.find_all = function(logical_paths, options, func) {
  var result = [];

  if (!func) {
    if (typeof(options) === 'function') {
      func = options;
      options = {};
    } else {
      func = function (path) {
        result.push(path);
      };
    }
  }

  if (!options) options = {};
  if (!Array.isArray(logical_paths)) logical_paths = [logical_paths];
  var base_path = options.basePath || this.root;

  logical_paths.forEach(function(logical_path) {
    var logical_path = logical_paths.shift().replace(/^\//, '');

    if (is_relative(logical_path)) {
      find_in_base_path(this, logical_path, base_path, fn);
    } else {
      find_in_paths(this, logical_path, fn);
    }
  });

  return result;
}

T.stat = function() {
  var result = null;
  try {
    result = fs.statSync(pathname);
  } catch (err) {
    if ('ENOENT' !== err.code) {
      throw err;
    }
  }

  return result;
}

T.entries = function() {
  var result = [];
  try {
    result = fs.readdirSync(pathname || '').filter(function (f) {
      return !/^\.|~$|^\#.*\#$/.test(f);
    }).sort();
  } catch (err) {
    if ('ENOENT' !== err.code) {
      throw err;
    }
  }

  return result;
}

T.prepend_paths = function(){}
T.append_paths = function(){}
T.remove_path = function(){}
T.prepend_extensions = function(){}
T.append_extensions = function(){}
T.remove_extension = function(){}
T.alias_extension = function(){}
T.unalias_extension = function(){}

T.cached = function() {
  return new CachedTrail(this);
}

