import fs from 'fs/promises';
import path from 'path';

const searchDir = './src';

async function processDirectory(directory) {
  const files = await fs.readdir(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    if (file.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.isFile() && (fullPath.endsWith('.jsx') || fullPath.endsWith('.js'))) {
      await processFile(fullPath);
    }
  }
}

async function processFile(filePath) {
  let content = await fs.readFile(filePath, 'utf8');
  let originalContent = content;
  
  // We want to replace new Date(X).toLocaleDateString(...) with formatDate(X)
  // But wait, there are cases where toLocaleDateString('en-US', {month: 'short'}) is used.
  // Let's manually filter or just replace ones without { month }
  
  // Actually, I can use a simpler approach:
  // Regex to find toLocaleDateString usages and replace those that don't have { month: 
  const regexDate = /new Date\(([^)]+)\)\.toLocaleDateString\(([^)]*)\)/g;
  content = content.replace(regexDate, (match, p1, p2) => {
    if (p2 && p2.includes('month')) return match; // skip formatters with options
    return `formatDate(${p1})`;
  });
  
  // Handle empty Date constructor: new Date().toLocaleDateString()
  const regexDateEmpty = /new Date\(\)\.toLocaleDateString\(([^)]*)\)/g;
  content = content.replace(regexDateEmpty, (match, p2) => {
    if (p2 && p2.includes('month')) return match; // skip formatters with options
    return `formatDate(Date.now())`;
  });

  // Regex to find toLocaleString usages and replace those that don't have { month:
  // Also avoid formatBDT which uses Number.toLocaleString
  const regexDateTime = /new Date\(([^)]+)\)\.toLocaleString\(([^)]*)\)/g;
  content = content.replace(regexDateTime, (match, p1, p2) => {
    if (p2 && p2.includes('month')) return match;
    return `formatDateTime(${p1})`;
  });

  const regexDateTimeEmpty = /new Date\(\)\.toLocaleString\(([^)]*)\)/g;
  content = content.replace(regexDateTimeEmpty, (match, p2) => {
    if (p2 && p2.includes('month')) return match; // skip formatters with options
    return `formatDateTime(Date.now())`;
  });

  if (content !== originalContent) {
    // Inject import if not present
    if (!content.includes("from '@/utils/dateHelper'")) {
      const needsFormatDate = content.includes('formatDate(');
      const needsFormatDateTime = content.includes('formatDateTime(');
      
      let importStr = "import { ";
      if (needsFormatDate) importStr += "formatDate";
      if (needsFormatDate && needsFormatDateTime) importStr += ", ";
      if (needsFormatDateTime) importStr += "formatDateTime";
      importStr += " } from '@/utils/dateHelper';\n";
      
      // Add after the last import
      const lastImportIndex = content.lastIndexOf("import ");
      if (lastImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, nextLineIndex + 1) + importStr + content.slice(nextLineIndex + 1);
      } else {
        content = importStr + content;
      }
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

processDirectory(searchDir).catch(console.error);
