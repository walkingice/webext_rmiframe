# Repository Guide

## Overview

This is a Firefox WebExtension (Manifest V2) that removes `iframe` elements
from the active page. Use plain JavaScript and the WebExtension `browser` API.

## Layout

- `manifest.json`: extension metadata, permissions, entry points, and shortcut.
- `js/`: background and content scripts.
- `popup/`: browser-action popup UI.
- `options/`: extension settings UI.
- `imgs/`: extension icons and image assets.

## Development

Install dependencies with `yarn install`. Build the extension with `make` or
`npx web-ext build --overwrite-dest`. Build output is written to
`web-ext-artifacts/`.

## Conventions

- Keep JavaScript dependency-free and compatible with the existing extension
  APIs.
- Keep message names and storage keys consistent across background, content,
  popup, and options scripts.
- Update `manifest.json` whenever an entry point, permission, command, or
  extension-facing asset changes.

