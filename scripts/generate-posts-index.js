const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '..', 'content', 'posts');
const files = fs.readdirSync(postsDir)
  .filter((file) => file.endsWith('.md'))
  .sort();

fs.writeFileSync(
  path.join(__dirname, '..', 'content', 'posts.json'),
  JSON.stringify(files, null, 2) + '\n'
);

console.log(`Indexed ${files.length} Markdown posts.`);
