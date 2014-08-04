/*global describe, it, beforeEach*/


'use strict';


// stdlib
var assert = require('assert');


// internal
var Aliases = require('../lib/hike/aliases');


describe('Aliases', function () {
  var aliases;


  beforeEach(function () {
    aliases = new Aliases();
  });


  it('should always return an instance of Extensions', function () {
    aliases.append('foo', 'bar');

    assert.equal('.bar',  aliases.get('foo').toArray().join(','));
    assert.equal('',      aliases.get('moo').toArray().join(','));
  });
});
