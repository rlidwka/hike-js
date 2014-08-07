'use strict';

var find = require('./find');

module.exports = function CachedTrail(trail) {
  if (!(this instanceof CachedTrail)) {
    return new CachedTrail(trail);
  }

  this.root = trail.root;
  this.extensions = trail.extensions.clone();
  this.paths = trail.paths.clone();
  this.reverse_aliases = {};
  for (var ext in trail.aliases) {
    this.reverse_aliases[ext] = trail.reverse_aliases[ext].slice(0);
  }

  // we need functions from Trail prototype, but can't get them
  // directly with require('./trail') because of a circular dependency
  this._trail_proto = Object.getPrototypeOf(trail);

  // cache for fs.readFileSync() calls
  this._entries = {};

  // cache for fs.statSync() calls
  this._stats = {};

  // cache for regexps
  this._patterns = {};
};

var T = module.exports.prototype;

T.find = function(paths, options, func) {
  return this.find_all(paths, options, func)[0];
};

T.find_all = function(paths, options, func) {
  return find(this, paths, options, func);
};

T.cached = function() {
  return this;
};

T.entries = function (pathname) {
  if (!this._entries[pathname]) {
    this._entries[pathname] = this._trail_proto.entries(pathname);
  }

  return this._entries[pathname];
};


T.stat = function (pathname) {
  if (null !== this._stats[pathname]) {
    this._stats[pathname] = this._trail_proto.stat(pathname);
  }

  return this._stats[pathname];
};
