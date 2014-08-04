# Public API

`Trail.paths` collection made private, you should manipulate it with `Trail.append_paths`, `Trail.prepend_paths` and `Trail.remove_path` methods.

`Trail.extensions` collection made private, you should manipulate it with `Trail.append_extensions`, `Trail.prepend_extensions` and `Trail.remove_extension` methods.

`Trail.aliases` collection made private, you should manipulate it with `Trail.alias_extension` and `Trail.unalias_extension` methods.

Added find_all function, `Trail.find()` is equivalent to `Trail.find_all()[0]`.

`Trail.index` renamed to `Trail.cached()`. It's now function instead of a getter.


# Private API

NormalizedArray is now subclass of the Array, not a class containing the Array. 
So `.toArray()` -> `.slice()`, `.append()` -> `.push()`, etc.

`Trail.aliases` (`String -> String`) changed to `Trail.reverse_aliases` (`String -> [String]`)

All freezing is removed, since those collections aren't supposed to be manipulated directly.

