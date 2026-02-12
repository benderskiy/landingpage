const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace ../ with ./ for relative paths
html = html.replace(/\.\.\//g, './');

fs.writeFileSync(indexPath, html);
console.log('Fixed asset paths in index.html');
