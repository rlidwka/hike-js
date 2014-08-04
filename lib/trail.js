'use strict';

var fs          = require('fs');
var Path        = require('path');
var NormArray   = require('./normalized_array');
var CachedTrail = require('./cached_trail');
var find        = require('./find');

module.exports = function Trail(root) {
  if (!(this instanceof Trail)) {
    return new Trail(root);
  }

  this.root = root = Path.resolve(root);
  this.extensions = new NormArray(normalize_extension);
  this.paths = new NormArray(function(p) {
    return Path.resolve(root, p);
  });
  this.aliases = {};
  this._patterns = {};
};

var T = module.exports.prototype;

T.find = function(paths, options, func) {
  return this.find_all(paths, options, func)[0];
};

T.find_all = function(logical_paths, options, func) {
  var result = find(this, logical_paths, options, func);
  this._patterns = {};
  return result;
};

T.stat = function(pathname) {
  var result = null;
  try {
    result = fs.statSync(pathname);
  } catch (err) {
    if ('ENOENT' !== err.code) {
      throw err;
    }
  }

  return result;
};

T.entries = function(pathname) {
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
};

T.prepend_path = T.prepend_paths = function() {
  var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
  return this.paths.unshift.apply(this.paths, args);
};

T.append_path = T.append_paths = function() {
  var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
  return this.paths.push.apply(this.paths, args);
};

T.remove_path = function(path) {
  var index = this.paths.indexOf(path);
  if (index != -1) {
    return this.paths.splice(index, 1)[0];
  }
};

T.prepend_extension = T.prepend_extensions = function() {
  var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
  return this.extensions.unshift.apply(this.extensions, args);
};

T.append_extension = T.append_extensions = function() {
  var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
  return this.extensions.push.apply(this.extensions, args);
};

T.remove_extension = function(ext) {
  var index = this.extensions.indexOf(ext);
  if (index != -1) {
    return this.extensions.splice(index, 1)[0];
  }
};

T.alias_extension = function(new_ext, old_ext) {
  new_ext = normalize_extension(new_ext);
  old_ext = normalize_extension(old_ext);
  if (!this.aliases[old_ext]) this.aliases[old_ext] = [];
  if (this.aliases[old_ext].indexOf(new_ext) != -1) {
    this.aliases[old_ext].push(new_ext);
  }
};

T.unalias_extension = function(ext) {
  ext = normalize_extension(ext);
  for (var k in this.aliases) {
    var i = this.aliases[k].indexOf(ext);
    if (i != -1) this.aliases[k].splice(i, 1);
  }
};

T.cached = function() {
  return new CachedTrail(this);
};

function normalize_extension(extension) {
  return '.' === extension[0] ? extension : '.' + extension;
}
