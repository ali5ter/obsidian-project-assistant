#!/usr/bin/env node

const { init, install } = require('./bootstrap.js');

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (command === 'init') {
    const vaultPath = args[1];
    if (!vaultPath) {
      console.error('Error: Please provide a vault path');
      console.error('Usage: obsidian-project-assistant init <path>');
      console.error('Example: obsidian-project-assistant init ~/Documents/MyVault');
      process.exit(1);
    }
    await init(vaultPath);
  } else if (command === 'install' || !command) {
    await install();
  } else {
    console.error('Unknown command:', command);
    console.error('Usage:');
    console.error('  obsidian-project-assistant init <path>   - Create new vault');
    console.error('  obsidian-project-assistant install        - Install to existing vault');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Installation failed:', error.message);
  process.exit(1);
});
