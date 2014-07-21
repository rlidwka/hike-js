
var fs = require('fs');
var Paths = require('./paths');
var Extensions = require('./extensions');
var Aliases = require('./aliases');

// TODO: signature correct?
var Trail = module.exports = function Trail(options) {
  if (!(this instanceof Trail)) {
    return new Trail(options);
  }

  if (typeof(options) === 'string') {
    this.root = String(options) || '.';
  } else {
    this.root = String(options.root) || '.';
    this.cache = Number(options.cache) || 0;
  }

  // TODO: just plain array?
  this.extensions = new Extensions();
  this.paths = new Paths();
  this.aliases = new Aliases();
}

Trail.prototype.find = function(paths, options, func) {
  return this.find_all(paths, options, func)[0];
}

Trail.prototype.find_all = function(logical_paths, options, func) {
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

// TODO: cache
Trail.prototype.stat = function() {
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

// TODO: cache
Trail.prototype.entries = function() {
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

