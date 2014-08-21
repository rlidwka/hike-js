'use strict';


var path = require('path');


// escape special chars.
// so the string could be safely used as literal in the RegExp.
function regexp_escape(str) {
  return str.replace(/([.?*+{}()\[\]])/g, '\\$1');
}

// tells whenever pathname seems like a relative path or not
function is_relative(pathname) {
  return /^\.\.?\//.test(pathname);
}

// Returns true if `dirname` is a subdirectory of any of the `paths`
function contains_path(self, dirname) {
  return self.paths.some(function(p) {
    return p === dirname.substr(0, p.length);
  });
}

// Returns a `Regexp` that matches the allowed extensions.
//
//     pattern_for(self, "index.html");
//     // -> /^index(.html|.htm)(.builder|.erb)*$/
function pattern_for(self, basename) {
  if (!self._patterns[basename]) {
    var extname = path.extname(basename);
    var aliases = self.reverse_aliases[extname];
    var pattern;

    if (!aliases || !aliases.length) {
      pattern = regexp_escape(basename);
    } else {
      basename = path.basename(basename, extname);
      pattern = regexp_escape(basename) +
                '(?:' +
                [extname].concat(aliases).map(regexp_escape).join('|') +
                ')';
    }

    pattern += '(?:' + self.extensions.map(regexp_escape).join('|') + ')*';
    self._patterns[basename] = new RegExp('^' + pattern + '$');
  }

  return self._patterns[basename];
}

// Sorts candidate matches by their extension priority.
// Extensions in the front of the `extensions` carry more weight.
function sort_matches(self, matches, basename) {
  var aliases = self.reverse_aliases[path.extname(basename)] || [];
  var weights = {};

  matches.forEach(function(match) {
    // XXX: this doesn't work well with aliases
    // i.e. entry=index.php, extnames=index.html
    var extnames = match.replace(basename, '').split('.');
    weights[match] = extnames.reduce(function(sum, ext) {
      if (!ext) {
        return sum;
      }

      ext = '.' + ext;

      if (0 <= self.extensions.indexOf(ext)) {
        return sum + self.extensions.indexOf(ext) + 1;
      } else if (0 <= aliases.indexOf(ext)) {
        return sum + aliases.indexOf(ext) + 11;
      } else {
        return sum;
      }
    }, 0);
  });

  return matches.sort(function(a, b) {
    return weights[a] > weights[b] ? 1 : -1;
  });
}

// Checks if the path is actually on the file system and performs
// any syscalls if necessary.
function match(self, dirname, basename, fn) {
  var pattern = pattern_for(self, basename);

  var matches = self.entries(dirname).filter(function(m) { return pattern.test(m); });

  sort_matches(self, matches, basename).forEach(function(filename) {
    var filePath = path.join(dirname, filename);
    var stats = self.stat(filePath);

    if (stats && stats.isFile()) {
      fn(filePath);
    }
  });
}

// Finds relative logical path, `../test/test_trail`. Requires a
// `base_path` for reference.
function find_in_base_path(self, logical_path, base_path, fn) {
  var candidate = path.resolve(base_path, logical_path);
  var dirname   = path.dirname(candidate);
  var basename  = path.basename(candidate);

  if (contains_path(self, dirname)) {
    match(self, dirname, basename, fn);
  }
}

module.exports = function find_all(self, logical_paths, options, fn) {
  var result = [];

  if (!Array.isArray(logical_paths)) {
    logical_paths = [logical_paths];
  }

  var base_path = options.basePath || self.root;
  var have_result = false;

  var iterator = function(p) {
    var fn_result;

    if (fn) {
      fn_result = fn(p);
      have_result = !!fn_result;
      result.push(fn_result);
    } else {
      have_result = true;
      result.push(p);
    }
  };

  logical_paths.forEach(function(logical_path) {
    var dirname, basename, i;

    logical_path = logical_path.replace(/^\//, '');

    if (is_relative(logical_path)) {
      find_in_base_path(self, logical_path, base_path, iterator);
    } else {
      dirname  = path.dirname(logical_path);
      basename = path.basename(logical_path);

      for (i = 0; i < self.paths.length; i++) {
        match(self, path.resolve(self.paths[i], dirname), basename, iterator);

        if (have_result && options._firstMatch) {
          break;
        }
      }
    }
  });

  return result;
};
