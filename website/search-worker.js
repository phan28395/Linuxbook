// Web Worker for offloading search operations
let allNodes = [];
let searchIndex = new Map();

// Build search index for faster lookups
function buildSearchIndex(nodes, parentPath = '') {
  nodes.forEach(node => {
    const nodePath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    
    // Index by name
    const nameLower = node.name.toLowerCase();
    for (let i = 0; i < nameLower.length; i++) {
      for (let j = i + 1; j <= nameLower.length; j++) {
        const substring = nameLower.substring(i, j);
        if (!searchIndex.has(substring)) {
          searchIndex.set(substring, []);
        }
        searchIndex.get(substring).push({
          node,
          path: nodePath,
          score: calculateScore(node, substring, i)
        });
      }
    }
    
    // Index by description
    if (node.metadata && node.metadata.description) {
      const descWords = node.metadata.description.toLowerCase().split(/\s+/);
      descWords.forEach(word => {
        if (word.length > 2) {
          if (!searchIndex.has(word)) {
            searchIndex.set(word, []);
          }
          searchIndex.get(word).push({
            node,
            path: nodePath,
            score: calculateScore(node, word, 0) * 0.5 // Lower score for description matches
          });
        }
      });
    }
    
    // Index commands
    if (node.operations && node.operations.commands) {
      node.operations.commands.forEach(cmd => {
        const cmdLower = cmd.cmd.toLowerCase();
        if (!searchIndex.has(cmdLower)) {
          searchIndex.set(cmdLower, []);
        }
        searchIndex.get(cmdLower).push({
          node,
          path: nodePath,
          score: calculateScore(node, cmdLower, 0) * 0.8
        });
      });
    }
    
    // Recursively index children
    if (node.children && node.children.length > 0) {
      buildSearchIndex(node.children, nodePath);
    }
  });
}

// Calculate relevance score for search results
function calculateScore(node, searchTerm, position) {
  let score = 100;
  
  // Exact match bonus
  if (node.name.toLowerCase() === searchTerm) {
    score += 50;
  }
  
  // Starting match bonus
  if (position === 0) {
    score += 30;
  }
  
  // Node type weights
  const typeWeights = {
    kernel: 1.2,
    service: 1.1,
    network: 1.1,
    filesystem: 1.0,
    userspace: 0.9
  };
  score *= typeWeights[node.type] || 1.0;
  
  // Level weights (prefer more accessible content)
  const levelWeights = {
    beginner: 1.3,
    intermediate: 1.0,
    advanced: 0.8
  };
  score *= levelWeights[node.level] || 1.0;
  
  // Penalize deep nesting
  const depth = (node.path || '').split(' > ').length;
  score *= Math.max(0.5, 1 - (depth * 0.05));
  
  return score;
}

// Fuzzy search implementation
function fuzzySearch(query) {
  const queryLower = query.toLowerCase();
  const results = new Map();
  
  // Direct index lookup
  if (searchIndex.has(queryLower)) {
    searchIndex.get(queryLower).forEach(result => {
      const key = result.node.id;
      if (!results.has(key) || results.get(key).score < result.score) {
        results.set(key, result);
      }
    });
  }
  
  // Fuzzy matching for partial queries
  if (queryLower.length >= 2) {
    searchIndex.forEach((entries, indexKey) => {
      if (indexKey.includes(queryLower) || queryLower.includes(indexKey)) {
        const distance = levenshteinDistance(queryLower, indexKey);
        const similarity = 1 - (distance / Math.max(queryLower.length, indexKey.length));
        
        if (similarity > 0.6) {
          entries.forEach(result => {
            const adjustedScore = result.score * similarity;
            const key = result.node.id;
            if (!results.has(key) || results.get(key).score < adjustedScore) {
              results.set(key, {
                ...result,
                score: adjustedScore
              });
            }
          });
        }
      }
    });
  }
  
  // Sort by score and return top results
  return Array.from(results.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 50); // Limit to top 50 results
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Filter nodes by criteria
function filterNodes(criteria) {
  const results = [];
  
  function filterRecursive(nodes, parentPath = '') {
    nodes.forEach(node => {
      const nodePath = parentPath ? `${parentPath} > ${node.name}` : node.name;
      let matches = true;
      
      // Type filter
      if (criteria.type && node.type !== criteria.type) {
        matches = false;
      }
      
      // Level filter
      if (criteria.level && node.level !== criteria.level) {
        matches = false;
      }
      
      // CS category filter
      if (criteria.category && node.cs_concepts) {
        const categories = node.cs_concepts.category || [];
        if (!categories.some(cat => cat.toLowerCase().includes(criteria.category.toLowerCase()))) {
          matches = false;
        }
      }
      
      // Has commands filter
      if (criteria.hasCommands && (!node.operations || !node.operations.commands || node.operations.commands.length === 0)) {
        matches = false;
      }
      
      // Has examples filter
      if (criteria.hasExamples && (!node.examples || node.examples.length === 0)) {
        matches = false;
      }
      
      if (matches) {
        results.push({
          node,
          path: nodePath
        });
      }
      
      // Recursively filter children
      if (node.children && node.children.length > 0) {
        filterRecursive(node.children, nodePath);
      }
    });
  }
  
  filterRecursive(allNodes);
  return results;
}

// Handle messages from main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'INIT':
      allNodes = data.nodes;
      searchIndex.clear();
      buildSearchIndex(allNodes);
      self.postMessage({
        type: 'INIT_COMPLETE',
        data: { indexSize: searchIndex.size }
      });
      break;
      
    case 'SEARCH':
      const searchResults = fuzzySearch(data.query);
      self.postMessage({
        type: 'SEARCH_RESULTS',
        data: {
          query: data.query,
          results: searchResults
        }
      });
      break;
      
    case 'FILTER':
      const filterResults = filterNodes(data.criteria);
      self.postMessage({
        type: 'FILTER_RESULTS',
        data: {
          criteria: data.criteria,
          results: filterResults
        }
      });
      break;
      
    case 'GET_STATS':
      self.postMessage({
        type: 'STATS',
        data: {
          totalNodes: countNodes(allNodes),
          indexSize: searchIndex.size,
          memoryUsage: roughSizeOfObject(searchIndex)
        }
      });
      break;
  }
});

// Count total nodes recursively
function countNodes(nodes) {
  let count = nodes.length;
  nodes.forEach(node => {
    if (node.children && node.children.length > 0) {
      count += countNodes(node.children);
    }
  });
  return count;
}

// Rough estimate of object size in bytes
function roughSizeOfObject(object) {
  const objectList = [];
  const stack = [object];
  let bytes = 0;
  
  while (stack.length) {
    const value = stack.pop();
    
    if (typeof value === 'boolean') {
      bytes += 4;
    } else if (typeof value === 'string') {
      bytes += value.length * 2;
    } else if (typeof value === 'number') {
      bytes += 8;
    } else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
      objectList.push(value);
      for (const i in value) {
        stack.push(value[i]);
      }
    }
  }
  
  return bytes;
}