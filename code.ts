// This plugin displays the names of selected layers and their children in a text format

// Open the UI with resize option enabled
figma.showUI(__html__, { 
  width: 400, 
  height: 300,
  themeColors: true,
});

// Restore previous size if available
figma.clientStorage.getAsync('size').then(size => {
  if (size) figma.ui.resize(size.w, size.h);
}).catch(err => {
  console.error("Error restoring window size:", err);
});

// Define a proper interface for the JSON node structure
interface LayerNodeJson {
  id: string;
  name: string;
  type: string;
  path: string;
  level: number;
  children: LayerNodeJson[];
}

// Function to get the full path of a node
function getNodePath(node: SceneNode): string {
  const path: string[] = [node.name];
  let parent = node.parent;
  
  while (parent && parent.type !== 'PAGE') {
    path.unshift(parent.name);
    parent = parent.parent;
  }
  
  return path.join(' / ');
}

// Function to recursively process a batch of nodes to prevent UI freezing
async function processNodesBatch(
  nodes: readonly SceneNode[],
  processedNodes: Set<string>,
  level: number,
  textResult: string[],
  simpleTextResult: string[],
  jsonResults: LayerNodeJson[]
): Promise<{ textResult: string[], simpleTextResult: string[], jsonResult: LayerNodeJson[] }> {
  // Process only a small batch at a time to prevent UI freezing
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < Math.min(BATCH_SIZE, nodes.length); i++) {
    const node = nodes[i];
    
    // Check if we've already processed this node to prevent infinite recursion
    if (processedNodes.has(node.id)) {
      const warningMsg = `${' '.repeat(level * 2)}⚠️ Cycle detected: ${node.name} (already processed)`;
      textResult.push(warningMsg);
      simpleTextResult.push(warningMsg);
      continue;
    }
    
    // Mark this node as processed
    processedNodes.add(node.id);
    
    // Add this node to the text results
    const indent = '  '.repeat(level);
    const fullPath = getNodePath(node);
    textResult.push(`${indent}${fullPath}`);
    simpleTextResult.push(`${indent}${node.name}`);
    
    // Prepare node for JSON output
    const jsonNode: LayerNodeJson = {
      id: node.id,
      name: node.name,
      type: node.type,
      path: fullPath,
      level,
      children: []
    };
    
    jsonResults.push(jsonNode);
    
    // Process children recursively (if any)
    if ('children' in node && node.children.length > 0) {
      // We'll process the children asynchronously
      await processNodesBatch(
        node.children,
        processedNodes,
        level + 1,
        textResult,
        simpleTextResult,
        jsonNode.children
      );
    }
  }
  
  // If there are more nodes to process, continue with the next batch
  // but first yield to the main thread
  if (nodes.length > BATCH_SIZE) {
    return new Promise(resolve => {
      setTimeout(async () => {
        const result = await processNodesBatch(
          nodes.slice(BATCH_SIZE),
          processedNodes,
          level,
          textResult,
          simpleTextResult,
          jsonResults
        );
        resolve(result);
      }, 0);
    });
  }
  
  return { textResult, simpleTextResult, jsonResult: jsonResults };
}

// Function to process the current selection and send to UI
async function processSelection() {
  const selection = figma.currentPage.selection;
  
  // Notify UI that processing has started and clear previous results
  figma.ui.postMessage({
    type: 'processing-started',
    clearData: true  // Signal the UI to clear previous data
  });
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'selection-data',
      text: 'No layers selected. Please select one or more layers.',
      simpleText: 'No layers selected. Please select one or more layers.',
      json: '[]'
    });
    return;
  }
  
  try {
    let allLayers: string[] = [];
    let allSimpleLayers: string[] = [];
    let jsonResult: LayerNodeJson[] = [];
    
    // Process each selected node recursively
    for (const node of selection) {
      // Create a new Set for each top-level selection to track processed nodes
      const processedNodes = new Set<string>();
      
      // Process this node and its children asynchronously
      const result = await processNodesBatch(
        [node],
        processedNodes,
        0,
        [],
        [],
        []
      );
      
      allLayers = allLayers.concat(result.textResult);
      allSimpleLayers = allSimpleLayers.concat(result.simpleTextResult);
      jsonResult = jsonResult.concat(result.jsonResult);
      
      // Yield to main thread between processing top-level nodes
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    figma.ui.postMessage({
      type: 'selection-data',
      text: allLayers.join('\n'),
      simpleText: allSimpleLayers.join('\n'),
      json: JSON.stringify(jsonResult, null, 2)
    });
  } catch (error) {
    console.error("Error processing selection:", error);
    figma.ui.postMessage({
      type: 'selection-data',
      text: `Error processing selection: ${error.message}`,
      simpleText: `Error processing selection: ${error.message}`,
      json: JSON.stringify({ error: error.message })
    });
  } finally {
    // Notify UI that processing is complete
    figma.ui.postMessage({
      type: 'processing-complete'
    });
  }
}

// Process initial selection
processSelection();

// Listen for selection changes
figma.on('selectionchange', () => {
  processSelection();
});

// Handle messages from the UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'refresh-selection') {
    processSelection();
  } else if (msg.type === 'close') {
    figma.closePlugin();
  } else if (msg.type === 'resize') {
    figma.ui.resize(msg.size.w, msg.size.h);
    figma.clientStorage.setAsync('size', msg.size).catch(err => {
      console.error("Error saving window size:", err);
    });
  }
};
