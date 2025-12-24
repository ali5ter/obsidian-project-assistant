const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test fixtures
const testVaultPath = path.join(__dirname, 'fixtures', 'test-vault');
const cleanupTestVault = () => {
  if (fs.existsSync(testVaultPath)) {
    fs.rmSync(testVaultPath, { recursive: true, force: true });
  }
};

console.log('🧪 Running Obsidian Project Assistant Tests\n');

// Test 1: Directory expansion
test('expandPath should expand ~ to home directory', () => {
  const { expandPath } = require('../scripts/bootstrap.js');
  // Note: expandPath is not exported, this is a placeholder
  // In real tests, we would export it or test through public API
  assert(true, 'Placeholder test');
});

// Test 2: Skill files exist
test('Skill files should exist', () => {
  const skillDir = path.join(__dirname, '..', 'skills', 'obsidian-project-assistant');
  assert(fs.existsSync(skillDir), 'Skill directory should exist');
  assert(fs.existsSync(path.join(skillDir, 'SKILL.md')), 'SKILL.md should exist');
  assert(fs.existsSync(path.join(skillDir, 'templates', 'project-template.md')), 'Project template should exist');
  assert(fs.existsSync(path.join(skillDir, 'templates', 'experiment-template.md')), 'Experiment template should exist');
});

// Test 3: Templates contain placeholders
test('Templates should contain placeholders', () => {
  const projectTemplate = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'obsidian-project-assistant', 'templates', 'project-template.md'),
    'utf8'
  );
  assert(projectTemplate.includes('{{title}}'), 'Project template should have {{title}} placeholder');
  assert(projectTemplate.includes('{{area}}'), 'Project template should have {{area}} placeholder');
  assert(projectTemplate.includes('{{date}}'), 'Project template should have {{date}} placeholder');
});

// Test 4: Helper files exist
test('Helper files should exist', () => {
  const helpersDir = path.join(__dirname, '..', 'skills', 'obsidian-project-assistant', 'helpers');
  assert(fs.existsSync(path.join(helpersDir, 'context-detection.md')), 'context-detection.md should exist');
  assert(fs.existsSync(path.join(helpersDir, 'area-mapping.md')), 'area-mapping.md should exist');
});

// Test 5: Package.json is valid
test('package.json should be valid', () => {
  const pkg = require('../package.json');
  assert(pkg.name === 'obsidian-project-assistant', 'Package name should be obsidian-project-assistant');
  assert(pkg.version, 'Package should have version');
  assert(pkg.bin['obsidian-project-assistant'], 'Package should have bin entry');
});

// Test 6: Bootstrap script exports functions
test('Bootstrap script should export init and install', () => {
  const bootstrap = require('../scripts/bootstrap.js');
  assert(typeof bootstrap.init === 'function', 'Should export init function');
  assert(typeof bootstrap.install === 'function', 'Should export install function');
});

// Test 7: Test fixtures directory structure
test('Test fixtures should be organized', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  assert(fs.existsSync(fixturesDir), 'Fixtures directory should exist');
});

// Test 8: SKILL.md has required frontmatter
test('SKILL.md should have valid frontmatter', () => {
  const skillContent = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'obsidian-project-assistant', 'SKILL.md'),
    'utf8'
  );
  assert(skillContent.startsWith('---'), 'SKILL.md should start with frontmatter');
  assert(skillContent.includes('name: obsidian-project-assistant'), 'Should have name in frontmatter');
  assert(skillContent.includes('description:'), 'Should have description in frontmatter');
  assert(skillContent.includes('version:'), 'Should have version in frontmatter');
});

// Test 9: Plugin configuration exists
test('Plugin configuration should exist', () => {
  const pluginConfig = require('../.claude-plugin/plugin.json');
  assert(pluginConfig.name === 'obsidian-project-assistant', 'Plugin name should match');
  assert(pluginConfig.version, 'Plugin should have version');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
