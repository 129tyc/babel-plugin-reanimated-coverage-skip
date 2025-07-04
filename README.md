# babel-plugin-reanimated-coverage-skip

A Babel plugin that automatically skips code coverage for React Native Reanimated worklet functions.

## Why?

React Native Reanimated worklet functions run on the UI thread and are difficult to test with traditional coverage tools. This plugin automatically adds `/* istanbul ignore file */` comments to files that contain worklet functions or import Reanimated.

## Installation

```bash
npm install --save-dev babel-plugin-reanimated-coverage-skip
```

## Usage

Add the plugin to your Babel configuration:

```json
{
  "plugins": ["babel-plugin-reanimated-coverage-skip"]
}
```

### With options

```json
{
  "plugins": [
    [
      "babel-plugin-reanimated-coverage-skip",
      {
        "cwd": "./",
        "include": ["src/**"],
        "exclude": ["test/**", "*.test.js", "mock/**"],
        "extension": [".js", ".ts", ".jsx", ".tsx"],
        "excludeNodeModules": true
      }
    ]
  ]
}
```

### Options

Uses the same configuration format as [nyc](https://github.com/istanbuljs/nyc#common-configuration-options):

- `cwd`: Working directory for resolving paths (default: `process.cwd()`)
- `include`: Array of glob patterns for files to include
- `exclude`: Array of glob patterns for files to exclude
- `extension`: Array of file extensions to process
- `excludeNodeModules`: Whether to exclude node_modules (default: `true`)

## How it works

The plugin will skip entire files that:

1. Import `react-native-reanimated` (or any module containing "reanimated")
2. Contain functions with the `'worklet'` directive

The plugin also respects existing skip coverage markers:

- Files already marked with `_skipCoverage` property by other plugins
- Files with existing ignore comments (`istanbul ignore file` or `skip-coverage`)

When a file needs to be skipped, the plugin:

- Sets `_skipCoverage` and `_skipReason` properties for programmatic access
- Adds `/* istanbul ignore file */` comment for coverage tools

## Example

Input:

```javascript
import { useSharedValue } from "react-native-reanimated";

function myWorklet() {
  "worklet";
  // worklet code
}
```

Output:

```javascript
/* istanbul ignore file - contains reanimated worklet functions */
import { useSharedValue } from "react-native-reanimated";

function myWorklet() {
  "worklet";
  // worklet code
}
```

## License

MIT
