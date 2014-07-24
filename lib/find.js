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
  var matches = self.entries(dirname);
  var pattern = pattern_for(self, basename);
  matches = matches.filter(function(m) { return pattern.test(m); });
  matches = sort_matches(self, matches, basename);
  for (var i=0; i<matches.length; i++) {
    var filename = Path.join(dirname, matches[i]);
    var stats = self.stat(filename);

    if (stats && stats.isFile()) {
      fn(filename);
    }
  }
}

function sort_matches(self, matches, basename) {
  var aliases = self.aliases[Path.extname(basename)];
  var weights = {};
  for (var i=0; i<matches.length; i++) {
    var match = matches[i];
    var extnames = match.replace(basename, '').split(/\./);
    weights[match] = extnames.reduce(function(sum, ext) {
      ext = '.' + ext;

      if (0 <= self.extensions.indexOf(ext)) {
        return sum + self.extensions.indexOf(ext) + 1;
      } else if (0 <= aliases.indexOf(ext)) {
        return sum + aliases.indexOf(ext) + 11;
      } else {
        return sum;
      }
    });
  }

  return matches.sort(function(a, b) {
    return weights[a] - weights[b];
  });
}

