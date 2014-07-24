'use strict';

var Path = require('path');

module.exports = function find(self, logical_paths, options, fn) {
  var result = [];

  if (!fn) {
    if (typeof(options) === 'function') {
      fn = options;
      options = {};
    }
  }

  if (!options) options = {};
  if (!Array.isArray(logical_paths)) logical_paths = [logical_paths];
  var base_path = options.basePath || self.root;

  var iterator = function(p) {
    result.push(fn ? fn(p) : p);
  }

  for (var i=0; i<logical_paths.length; i++) {
    var logical_path = logical_paths[i].replace(/^\//, '');

    if (is_relative(logical_path)) {
      find_in_base_path(self, logical_path, base_path, iterator);
    } else {
      find_in_paths(self, logical_path, iterator);
    }
  }

  return result;
};

function regexp_escape(str) {
  return str.replace(/([.?*+{}()\[\]])/g, '\\$1');
}

function is_relative(pathname) {
  return /^\.\.?\//.test(pathname);
}

function find_in_base_path(self, logical_path, base_path, fn) {
  var candidate = Path.resolve(base_path, logical_path);
  var dirname   = Path.dirname(candidate);
  var basename  = Path.basename(candidate);

  if (contains_path(self, dirname)) {
    match(self, dirname, basename, fn);
  }
}

function find_in_paths(self, logical_path, fn) {
  var dirname  = Path.dirname(logical_path);
  var basename = Path.basename(logical_path);

  for (var i=0; i<self.paths.length; i++) {
    match(self, Path.resolve(self.paths[i], dirname), basename, fn);
  }
}

function contains_path(self, dirname) {
  for (var i=0; i<self.paths.length; i++) {
    var path = self.paths[i] + '/';
    if (path === dirname.substr(0, path.length)) return true;
  };
  return false;
}

function pattern_for(self, basename) {
  if (!self._patterns[basename]) {
    var extname = Path.extname(basename);
    var aliases = self.aliases[extname];
    var pattern;

    if (!aliases || !aliases.length) {
      pattern = regexp_escape(basename);
    } else {
      basename = Path.basename(basename, extname);
      pattern = regexp_escape(basename)
              + '(?:'
              + [extname].concat(aliases).map(regexp_escape).join('|')
              + ')';
    }

    pattern += '(?:' + self.extensions.map(regexp_escape).join('|') + ')*';
    self._patterns[basename] = new RegExp('^' + pattern + '$');
  }

  return self._patterns[basename];
}

function match(self, dirname, basename, fn) {
  var entries = self.entries(dirname);
  var pattern = pattern_for(self, basename);
  var result = [];

  var aliases = self.aliases[Path.extname(basename)];
  var weights = {};

  for (var i=0; i<entries.length; i++) {
    var entry = entries[i];
    if (!pattern.test(entry)) continue;

    var stats = self.stat(Path.join(dirname, entry));
    if (!stats || !stats.isFile()) continue;

    var extnames = entry.substr(basename.length).split('.');
    weights[entry] = extnames.reduce(function(sum, ext) {
      var t
      ext = '.' + ext;

      if (0 <= (t = self.extensions.indexOf(ext))) {
        return sum + t + 1;
      } else if (0 <= (t = aliases.indexOf(ext))) {
        return sum + t + 11;
      } else {
        return sum;
      }
    });
    result.push(entry);
  }

  result.sort(function(a, b) {
    return weights[a] > weights[b] ? 1 : -1;
  }).forEach(fn);
}

