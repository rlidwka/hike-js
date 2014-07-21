
var fs = require('fs');
var Paths = require('./paths');
var Extensions = require('./extensions');
var Aliases = require('./aliases');

module.exports = function CachedTrail(trail) {
  if (!(this instanceof CachedTrail)) {
    return new CachedTrail(trail);
  }

  this._root = trail._root;
  this._extensions = trail._extensions.slice(0);
  this._paths = trail._extensions.slice(0);
  this._aliases = ... todo ...;
  this._trail_proto = Object.getPrototypeOf(trail);

  this._entries = {};
  this._stats = {};
}

var T = module.exports.prototype

T.cached = function() {
	return this;
}

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
