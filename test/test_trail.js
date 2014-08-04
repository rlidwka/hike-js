/*global describe, it, beforeEach*/


'use strict';


// stdlib
var fs      = require('fs');
var path    = require('path');
var assert  = require('assert');


// TODO: Remove once Node.JS < 0.8 support is dropped
fs.existsSync = fs.existsSync || path.existsSync;


// internal
var Trail = require('../').Trail;
var FIXTURE_ROOT = path.join(__dirname, 'fixtures');
function fixturePath (apath) {
  return path.join(FIXTURE_ROOT, apath);
}

describe('Trail', function () {
  var trail;

  beforeEach(function () {
    trail = new Trail(FIXTURE_ROOT);
    trail.append_paths('app/views', 'vendor/plugins/signal_id/app/views', '.');
    trail.append_extensions('builder', 'coffee', 'str', '.erb');
    trail.alias_extension('html', 'htm');
    trail.alias_extension('html', 'xhtml');
    trail.alias_extension('html', 'php');
    trail.alias_extension('js', 'coffee');
  });

  it('test trail root', function () {
    assert.equal(FIXTURE_ROOT, trail.root);
  });

  it('test trail paths', function () {
    assert.deepEqual([fixturePath('app/views'),
      fixturePath('vendor/plugins/signal_id/app/views'),
      fixturePath('.')], trail.paths.slice(0));
  });

  it('test trail extensions', function () {
    assert.deepEqual(['.builder', '.coffee', '.str', '.erb'], trail.extensions.slice());
  });

  it('test trail index', function () {
    // assert_kind_of Hike::Index, trail.index
    // what's the js equivalent?
    assert.equal(trail.root, trail.cached().root);
    assert.deepEqual({}, trail.cached()._entries);
    assert.equal(undefined, trail._entries);
  });

  it('test nonexistent file', function () {
    assert.equal(undefined, trail.find('people/show.html'));
  });

  it('test find without an extension', function () {
    assert.equal(fixturePath('app/views/projects/index.html.erb'),
      trail.find('projects/index.html'));
  });

  it('test find with an extension', function () {
    assert.equal(fixturePath('app/views/projects/index.html.erb'),
      trail.find('projects/index.html.erb'));
  });

  it('test find with leading slash', function () {
    assert.equal(fixturePath('app/views/projects/index.html.erb'),
      trail.find('/projects/index.html'));
  });

  it('test find respects path order', function () {
    assert.equal(fixturePath('app/views/layouts/interstitial.html.erb'),
      trail.find('layouts/interstitial.html'));
    // trail = new_trail { |t| t.paths.replace t.paths.reverse }
    trail.prepend_paths('vendor/plugins/signal_id/app/views');
    assert.equal(fixturePath('vendor/plugins/signal_id/app/views/layouts/interstitial.html.erb'),
      trail.find('layouts/interstitial.html'));
  });

  it('test find respects extension order', function () {
    assert.equal( fixturePath('app/views/recordings/index.atom.builder'),
      trail.find('recordings/index.atom'));
    // trail = new_trail { |t| t.paths.replace t.paths.reverse }
    trail.prepend_extensions('erb');
    assert.equal(fixturePath('app/views/recordings/index.atom.erb'),
      trail.find('recordings/index.atom'));
  });

  it('test find with multiple logical paths returns first match', function () {
    assert.equal(fixturePath('app/views/recordings/index.html.erb'),
      trail.find(['recordings/index.txt', 'recordings/index.html', 'recordings/index.atom']));
  // no recordings/index.txt.*
  });

  it('test find file in path root returns expanded path', function () {
    assert.equal(fixturePath('app/views/index.html.erb'),
      trail.find('index.html'));
  });

  it('test find extensionless file', function () {
    assert.equal(fixturePath('README'), trail.find('README'));
  });

  it('test find file with multiple extensions', function () {
    assert.equal(
      fixturePath('app/views/projects/project.js.coffee.erb'),
      trail.find('projects/project.js'));
  });

  it('test find file with multiple extensions respects extension order', function () {
    assert.equal(
      fixturePath('app/views/application.js.coffee.str'),
      trail.find('application.js'));
    // trail = new_trail { |t| t.paths.replace t.paths.reverse }
    trail.prepend_extension('erb');
    assert.equal(fixturePath('app/views/application.js.coffee.erb'),
      trail.find('application.js'));
  });

  it('test find file by aliased extension', function () {
    assert.equal(
      fixturePath('app/views/people.coffee'),
      trail.find('people.coffee'));
    assert.equal(
      fixturePath('app/views/people.coffee'),
      trail.find('people.js'));
    assert.equal(
      fixturePath('app/views/people.htm'),
      trail.find('people.htm'));
    assert.equal(
      fixturePath('app/views/people.htm'),
      trail.find('people.html'));
  });

  it('test find file with aliases prefers primary extension', function () {
    assert.equal(fixturePath('app/views/index.html.erb'),
      trail.find('index.html'));
    assert.equal(fixturePath('app/views/index.php'),
      trail.find('index.php'));
  });

  it('test find with base path option and relative logical path', function () {
    assert.equal(fixturePath('app/views/projects/index.html.erb'),
      trail.find('./index.html', {'basePath': fixturePath('app/views/projects')}));
  });

  it('test find ignores base path option when logical path is not relative', function () {
    assert.equal(fixturePath('app/views/index.html.erb'),
      trail.find('index.html', {'basePath': fixturePath('app/views/projects')}));
  });

  it('test base path option must be expanded', function () {
    assert.equal(undefined,
      trail.find('./index.html', {'basePath': 'app/views/projects'}));
  });

  it('test relative files must exist in the path', function () {
    assert.doesNotThrow(function () {
      require('fs').statSync(path.join(FIXTURE_ROOT, '../test_trail.js'));
    });
    assert.equal(undefined,
      trail.find('../test_trail.js', {'basePath': FIXTURE_ROOT}));
  });

  it('test find all respects path order', function () {
    var results = [];
    trail.find('layouts/interstitial.html', function (apath){
      results.push(apath);
    });
    assert.deepEqual([
      fixturePath('app/views/layouts/interstitial.html.erb'),
      fixturePath('vendor/plugins/signal_id/app/views/layouts/interstitial.html.erb')
    ], results);
  });

  it('test find all with multiple extensions respects extension order', function () {
    var results = [];
    trail.find('application.js', function (apath){
      results.push(apath);
    });
    assert.deepEqual([
      fixturePath('app/views/application.js.coffee.str'),
      fixturePath('app/views/application.js.coffee.erb')
    ], results);
  });

  it('test find filename instead directory', function () {
    assert.equal(fixturePath('app/views/projects.erb'),
      trail.find('projects'));
  });

  it('test ignores directories', function () {
    assert.equal(undefined, trail.find('recordings'));
  });

  it('test entries', function () {
    var entries = trail.entries(fixturePath('app/views')).sort();
    var expected = [
      'application.js.coffee.erb',
      'application.js.coffee.str',
      'index.html.erb',
      'index.php',
      'layouts',
      'people.coffee',
      'people.htm',
      'projects',
      'projects.erb',
      'recordings'
    ];
    assert.deepEqual(entries, expected);
  });

  it('test stat', function () {
    assert(trail.stat(fixturePath('app/views/index.html.erb')));
    assert(trail.stat(fixturePath('app/views')));
    assert.equal(undefined, trail.stat(fixturePath('app/views/missing.html')));
  });

  it('test find reflects changes in the file system', function () {
    var tempfile = fixturePath('dashboard.html');
    assert.equal(undefined, trail.find('dashboard.html'));
    try {
      fs.writeFileSync(tempfile, '');
      assert.equal(fixturePath('dashboard.html'), trail.find('dashboard.html'));
    } finally {
      fs.unlinkSync(tempfile);
      assert(!fs.existsSync(tempfile));
    }
  });

});

describe('IntexText', function () {
  var trail;
  var asset;

  beforeEach(function () {
    trail = new Trail(FIXTURE_ROOT);
    trail.append_paths('app/views', 'vendor/plugins/signal_id/app/views', '.');
    trail.append_extensions('builder', 'coffee', 'str', '.erb');
    trail.alias_extension('html', 'htm');
    trail.alias_extension('html', 'xhtml');
    trail.alias_extension('html', 'php');
    trail.alias_extension('js', 'coffee');
    trail = trail.cached();
  });

  // rb reruns most of previous tests using this trail.index
  // pick one at random
  it('test find file with multiple extensions', function () {
    assert.equal(
      fixturePath('app/views/projects/project.js.coffee.erb'),
      trail.find('projects/project.js'));
  });

  it('test changing trail path doesnt affect index', function () {
    var trail = new Trail(FIXTURE_ROOT);
    trail.append_path('.');
    var index = trail.cached();
    assert.deepEqual([fixturePath('.')], trail.paths.slice());
    assert.deepEqual([fixturePath('.')], index.paths.slice());
    trail.append_paths('app/views');
    assert.deepEqual([fixturePath('.'), fixturePath('app/views')], trail.paths.slice());
    assert.deepEqual([fixturePath('.')], index.paths.slice());
  });


  it('test changing trail extensions doesnt affect index', function () {
    var trail = new Trail(FIXTURE_ROOT);
    trail.append_extension('builder');
    var index = trail.cached();
    assert.deepEqual(['.builder'], trail.extensions.slice());
    assert.deepEqual(['.builder'], index.extensions.slice());
    trail.append_extension('str');
    assert.deepEqual(['.builder', '.str'], trail.extensions.slice());
    assert.deepEqual(['.builder'], index.extensions.slice());
  });


  it('test index find does not reflect changes in the file system', function () {
    // trail here is its index
    var tempfile = fixturePath('dashboard.html');
    assert(!fs.existsSync(tempfile));
    assert.equal(undefined, trail.find('dashboard.html'));
    try {
      fs.writeFileSync(tempfile, '');
      asset = trail.find('dashboard.html');
      assert.equal(undefined, asset);
    } finally {
      fs.unlinkSync(tempfile);
      assert(!fs.existsSync(tempfile));
    }
  });

});
