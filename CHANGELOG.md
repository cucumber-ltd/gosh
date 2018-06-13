# CHANGE LOG

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org).

This document is formatted according to the principles of [Keep A CHANGELOG](http://keepachangelog.com).

----
## [In Git](https://github.com/cucumber-ltd/gosh/compare/v5.3.0...master) (Not released)

## [v5.3.0](https://github.com/mattwynne/gosh/compare/v5.2.0...v5.3.0)

### Added

* N/A

### Changed

* Events changed from three `insert`, `update` and `delete` events to a single `change` event with `from` and `to` properties.

### Deprecated

* N/A

### Removed

* N/A

### Fixed

* timing issue - missing await

## [v5.2.0](https://github.com/mattwynne/gosh/compare/v4.3.0...v5.2.0)

### Added

* N/A

### Changed

* API for building stores has been simplified.
* Everything is async, ready for a persistent store!

### Deprecated

* N/A

### Removed

* N/A

### Fixed

* N/A

## [In Git](https://github.com/mattwynne/gosh/compare/v4.2.0...v4.3.0)

### Added

* N/A

### Changed

* Emit insert / update / delete events

### Deprecated

* N/A

### Removed

* N/A

### Fixed

* N/A

## [In Git](https://github.com/mattwynne/gosh/compare/v4.1.0...v4.2.0)

### Added

* `DocumentStore#updateAll` to let you update document(s) matching a query with a function.

### Changed

* N/A

### Deprecated

* N/A

### Removed

* N/A

### Fixed

* N/A

## [4.1.0](https://github.com/mattwynne/gosh/compare/v4.0.0...v4.1.0)

### Added

* DocumentStore#empty for deleting everything. Useful for testing.

### Changed

* N/A

### Deprecated

* N/A

### Removed

* N/A

### Fixed

* N/A

## [v4.0.0](https://github.com/mattwynne/gosh/compare/v3.1.0...v4.0.0)

### Added

* DocumentStore#withIndexOfAll for indexing many-many relationships

### Changed

* `DocumentStore#withIndex` now works instead of the old `withUniqueIndex`, `withOptionalUniqueIndex` and `withOneToManyIndex`

### Deprecated

* N/A

### Removed

* `DocumentStore#withUniqueIndex`, `DocumentStore#withOptionalUniqueIndex` and `DocumentStore#withOneToManyIndex`

### Fixed

* N/A


## [v3.1.0](https://github.com/mattwynne/gosh/compare/v3.0.0...v3.1.0) (Not released)

### Added

* DocumentStore#forQueries returns a read-only interface onto the store

### Changed

* N/A

### Deprecated

* N/A

### Removed

* N/A

### Fixed

* N/A

## [v3.0.0](https://github.com/mattwynne/gosh/compare/v2.0.0...v3.0.0)

### Added

* Implicitly add a unique index on the ID field

### Changed

* Changed constructor on DocumentStore to take `makeId` function as a regular argument

### Deprecated

* N/A

### Removed

* N/A

### Fixed

* N/A

## [v2.0.0](https://github.com/mattwynne/gosh/compare/v1.0.0...v2.0.0) (Not released)

### Added

* N/A

### Changed

* N/A

### Deprecated

* N/A

### Removed

* `DocumentStore#find` replaced with `DocumentStore#get`

### Fixed

* N/A

## [1.0.0]

Initial release
