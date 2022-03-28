# Changelog

All notable changes to the "html-encoder" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2020-06-14

### Added

- VSCode extension support
- VSCode compatibility tests

### Changed

- Documentation

## [1.0.1] - 2020-06-17

### Added

- Support for ES outputs + test

### Fixed

- support for typescript

## [1.0.2] - 2020-06-18

### Changed

- Updated the icon

### Removed

- CLI Support

### Fixed

- support for typescript (realized `.vscodeignore` prevents packing ts files)
- getNode() now returns Node instead of the obscure JSNode

## [1.0.3] - 2020-06-19

### Fixed

- more fixes for typescript

## [1.0.4] - 2020-06-28

### Added

- Added more test, especially for typescript output

### Fixed

- improved support for loops (empty initial value + switching from arrays and objects)

## [1.0.5] - 2020-08-09

### Fixed

- property.node is now Node (and not Element) to support TextNode
- can now handle using the same conditional more than once
- support for css in loops

### Known Issues

1. ServerSide text condition cannot be removed (as I didn't have where to mark the data-live-if-child)

## [2.0.0] - 2020-10-24

### Removed

- CLI support + vscode extension support (move to separate projects).

### Added

- import-file support

## [2.0.3] - 2020-10-24

- 🐛 Fixed server-side PI not working when file not reactive
- 🎨 moved output folder to dist
- 🚑 fixed travis ci node version to support imports
- 🚑 moved d.ts file to main out folder

## [2.0.4] - 2020-11-07

- 🚚 Moved typescript code chunk to its own folder
- Removed the js-node.map comment from the js template

## [2.0.6] - 2020-11-14

- 📝 added repository to package.json
- 📝 updated Readme

## [2.0.7] - 2022-01-13

- ⬆️ Upgraded dependencies

## [2.0.8] - 2022-01-13

- 🎨  Improved code (cleaner output)

## [2.0.9] - 2022-01-13

- 📝 updated Readme
- ✨ Cleaned output file

## [2.0.10] - 22-02-11

- ➖ remove request-from-string dependency
- ✨ added generic `/` as subroutine-end
- ✨ better handling of functions and objects as data
- ✨ added 'code' as optional output

## [2.1.1] - 22-03-09

- ✨ added support for nested functions

## [2.1.2] - 22-03-28

- 🐛 Fixed issue bug with conditions
- 🐛 Fixed issue bug with nested conditions
