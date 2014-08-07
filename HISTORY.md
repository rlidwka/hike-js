unreleased
----------

- Hike interface sync'd with sstephenson/hike 2.1.3.

- Public API:
  - `Trail.paths` collection made private, you should manipulate it with `Trail.append_paths`, `Trail.prepend_paths` and `Trail.remove_path` methods.
  - `Trail.extensions` collection made private, you should manipulate it with `Trail.append_extensions`, `Trail.prepend_extensions` and `Trail.remove_extension` methods.
  - `Trail.aliases` collection made private, you should manipulate it with `Trail.alias_extension` and `Trail.unalias_extension` methods.
  - Added find_all function, `Trail.find()` is equivalent to `Trail.find_all()[0]`.
  - `Trail.index` renamed to `Trail.cached()`. It's now function instead of a getter.

- Internal API:
  - NormalizedArray is now subclass of the Array, not a class containing the Array. 
So `.toArray()` -> `.slice()`, `.append()` -> `.push()`, etc.
  - `Trail.aliases` (`String -> String`) changed to `Trail.reverse_aliases` (`String -> [String]`)
  - All freezing is removed, since those collections aren't supposed to be manipulated directly.

0.1.3 / 2014-01-08
------------------

- Maintenance release. Dependencies & lint rules update.


0.1.2 / 2013-06-16
------------------

- Maintenance release. Replaced `underscore` with `lodash`,
  and different minor/cosmetic changes.


0.1.1 / 2012-10-13
------------------

- Fix order of paths tried upon find loop.


0.1.0 / 2012-05-15
------------------

- First release
