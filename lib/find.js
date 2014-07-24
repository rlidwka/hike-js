'use strict';

var Path = require('path');

module.exports = function find(self, logical_paths, options, fn) {
  var base_path = options.basePath || self.root;

  logical_paths.forEach(function(logical_path) {
    logical_path = logical_path.replace(/^\//, '');

    if (is_relative(logical_path)) {
      find_in_base_path(self, logical_path, base_path, fn);
    } else {
      find_in_paths(self, logical_path, fn);
    }
  });
};

function regexp_escape(str) {
  return str.replace(/([.?*+{}()\[\]])/g, '\\$1');
}

function is_relative(pathname) {
  return (/^\.\.?\//).test(pathname);
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

  self.paths.forEach(function(base_path) {
    match(self, Path.resolve(base_path, dirname), basename, fn);
  });
}

function contains_path(self, dirname) {
  // XXX: does dirname have trailing slash?
  return self.paths.some(function(path) {
    return path === dirname.substr(0, path.length);
  });
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

  sort_matches(self, matches, basename).forEach(function(path) {
    var filename = Path.join(dirname, path);
    var stats = self.stat(filename);

    if (stats && stats.isFile()) {
      fn(filename);
    }
  });
}

function sort_matches(self, matches, basename) {
  var aliases = self.aliases[Path.extname(basename)];
  var weights = {};
  matches.forEach(function(match) {
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
  });

  return matches.sort(function(a, b) {
    return weights[a] - weights[b];
  });
}

