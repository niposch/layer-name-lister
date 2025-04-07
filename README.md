# Figma Recursive Layer Names

A Figma plugin that provides a hierarchical view of selected layers and their children. This plugin makes it easy to copy layer names with their complete hierarchy or simple structure for documentation, handoff, or reference purposes.

## Features

- **Recursive Layer Traversal**: Lists all selected layers and recursively shows their children
- **Multiple Output Formats**:
  - Full Paths: Shows complete hierarchical paths of each layer
  - Simple Names: Shows only the layer names without parent paths
  - JSON Format: Structured data format including layer IDs, types, and hierarchy
- **Cycle Detection**: Avoids infinite loops with automatic cycle detection
- **Copy to Clipboard**: One-click copy of the entire layer hierarchy
- **Live Updates**: Automatically updates when selection changes
- **Resizable Interface**: Adjust the plugin window size to your needs
- **Performance Optimized**: Handles large layer structures efficiently with batch processing

## How to Use

1. Select one or more layers in your Figma design
2. Run the "Recursive Layer Names" plugin
3. View the hierarchical structure of your selection
4. Choose your preferred format:
   - Default: Full hierarchical paths
   - Simple names only: Just the node names without parent paths
   - JSON Format: Structured data for programmatic use
5. Click "Copy to Clipboard" to copy the content
6. Use the resize handle in the bottom-right corner to adjust the window size

## Example Output

### Full Paths (Default)
```
Frame 1
  Frame 1 / Button
    Frame 1 / Button / Label
    Frame 1 / Button / Icon
  Frame 1 / Content
    Frame 1 / Content / Title
    Frame 1 / Content / Description
```

### Simple Names
```
Frame 1
  Button
    Label
    Icon
  Content
    Title
    Description
```

### JSON Format
```json
[
  {
    "id": "1:2",
    "name": "Frame 1",
    "type": "FRAME",
    "path": "Frame 1",
    "level": 0,
    "children": [
      {
        "id": "1:3",
        "name": "Button",
        "type": "INSTANCE",
        "path": "Frame 1 / Button",
        "level": 1,
        "children": [...]
      },
      ...
    ]
  }
]
```

## Development Tips

### Setup
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile TypeScript files
4. Or use `npm run watch` to automatically recompile on changes

### Project Structure

- **code.ts**: Main plugin code that handles selection processing and UI communication
- **ui.html**: UI implementation with styles, buttons, and result display
- **manifest.json**: Plugin configuration file



For more information on Figma plugin development, visit the [Figma Plugin Documentation](https://www.figma.com/plugin-docs/).