// Save this as checkExports.js in your project root
// Run it with: node checkExports.js

const fs = require('fs');
const path = require('path');

// Directories to check
const directories = ['./src', './src/pages', './src/components'];

// Find all JS/JSX files
function findJSFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist, skipping`);
    return [];
  }
  
  const files = fs.readdirSync(dir);
  let jsFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (file !== 'node_modules' && file !== 'build') {
        jsFiles = jsFiles.concat(findJSFiles(filePath));
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      jsFiles.push(filePath);
    }
  });
  
  return jsFiles;
}

// Check export pattern
function checkExportPattern(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const componentName = fileName.split('.')[0];
    
    // Skip files that are clearly not React components
    if (fileName.includes('.test.') || fileName.includes('.spec.') || 
        fileName === 'index.js' || fileName === 'setupTests.js' || 
        fileName === 'reportWebVitals.js' || fileName === 'serviceWorker.js') {
      return;
    }
    
    console.log(`\nChecking ${filePath}:`);
    
    // Check for React component patterns
    const hasReactImport = content.includes('import React') || content.includes('from "react"');
    const hasJSXPattern = content.includes('return (') && (content.includes('<') && content.includes('/>') || content.includes('</'));
    
    if (!hasReactImport && !hasJSXPattern) {
      console.log('  Not a React component file, skipping');
      return;
    }
    
    // Check export patterns
    const hasDefaultExport = content.includes('export default ');
    const hasNamedComponentExport = content.match(new RegExp(`export const ${componentName}`)) || 
                                    content.match(new RegExp(`export function ${componentName}`));
    const hasComponentDeclaration = content.match(new RegExp(`(const|function) ${componentName}`));
    
    if (hasDefaultExport) {
      console.log('  ✅ Has default export');
    } else {
      console.log('  ❌ No default export found');
    }
    
    if (hasNamedComponentExport) {
      console.log('  ⚠️ Has named export matching the file name');
    }
    
    if (hasComponentDeclaration && !hasDefaultExport && !hasNamedComponentExport) {
      console.log('  ⚠️ Component is declared but not exported');
    }
    
    // Provide recommendation
    if (!hasDefaultExport) {
      console.log('  SUGGESTION: Add "export default ' + componentName + ';" at the end of the file');
      if (hasNamedComponentExport) {
        console.log('  OR: Change imports to use: import { ' + componentName + ' } from "' + path.dirname(filePath.replace('./src/', './')) + '/' + componentName + '";');
      }
    }
  } catch (err) {
    console.error(`Error checking ${filePath}:`, err);
  }
}

// Main function
function main() {
  console.log('Checking React component exports...');
  let jsFiles = [];
  
  directories.forEach(dir => {
    jsFiles = jsFiles.concat(findJSFiles(dir));
  });
  
  console.log(`Found ${jsFiles.length} JavaScript files to check`);
  jsFiles.forEach(checkExportPattern);
  
  console.log('\nExport check complete! Fix any missing default exports in components.');
}

main();