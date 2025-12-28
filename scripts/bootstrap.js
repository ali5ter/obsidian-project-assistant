const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function expandPath(filePath) {
  if (filePath.startsWith('~')) {
    return path.join(process.env.HOME, filePath.slice(1));
  }
  return path.resolve(filePath);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function init(vaultPath) {
  const expandedVaultPath = expandPath(vaultPath);

  console.log('🗂️  Obsidian Project Assistant - New Vault Setup');
  console.log('================================================\n');

  // Check if path exists
  if (fs.existsSync(expandedVaultPath)) {
    const files = fs.readdirSync(expandedVaultPath);
    if (files.length > 0) {
      const answer = await question(`⚠️  Directory ${expandedVaultPath} already exists and is not empty. Continue? (y/N): `);
      if (answer.toLowerCase() !== 'y') {
        console.log('Installation cancelled.');
        rl.close();
        return;
      }
    }
  }

  console.log(`📁 Creating vault structure at: ${expandedVaultPath}\n`);

  // Create directory structure
  const dirs = [
    'Projects',
    'Areas/Hardware',
    'Areas/Software',
    'Areas/Woodworking',
    'Areas/Music Synthesis',
    'Resources',
    'Templates',
    'Daily',
    'Archive',
    '.obsidian'
  ];

  for (const dir of dirs) {
    const dirPath = path.join(expandedVaultPath, dir);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✓ Created ${dir}/`);
  }

  // Copy templates to vault
  console.log('\n📝 Installing templates...');
  const skillDir = path.join(__dirname, '..', 'skills', 'obsidian-project-assistant');
  const templatesSource = path.join(skillDir, 'templates');
  const templatesDest = path.join(expandedVaultPath, 'Templates');

  if (fs.existsSync(templatesSource)) {
    const templates = fs.readdirSync(templatesSource);
    for (const template of templates) {
      const src = path.join(templatesSource, template);
      const dest = path.join(templatesDest, template.replace('project-template', 'Project Template')
                                                    .replace('experiment-template', 'Experiment Template')
                                                    .replace('daily-note-template', 'Daily Note Template'));
      fs.copyFileSync(src, dest);
      console.log(`  ✓ ${path.basename(dest)}`);
    }
  }

  // Create .gitignore
  const gitignoreContent = `.obsidian/workspace*
.obsidian/workspace.json
.DS_Store
.trash/
`;
  fs.writeFileSync(path.join(expandedVaultPath, '.gitignore'), gitignoreContent);
  console.log('  ✓ .gitignore');

  // Ask about git init
  const gitAnswer = await question('\n🔧 Initialize git repository? (Y/n): ');
  if (gitAnswer.toLowerCase() !== 'n') {
    try {
      execSync('git init', { cwd: expandedVaultPath, stdio: 'ignore' });
      execSync('git add .', { cwd: expandedVaultPath, stdio: 'ignore' });
      execSync('git commit -m "Initial vault setup\\n\\n🤖 Created with Obsidian Project Assistant"', {
        cwd: expandedVaultPath,
        stdio: 'ignore'
      });
      console.log('  ✓ Git repository initialized');
    } catch (error) {
      console.log('  ⚠️  Git initialization failed (git may not be installed)');
    }
  }

  // Install skill
  console.log('\n🎯 Installing skill...');
  await installSkill(expandedVaultPath);

  // Success message
  console.log('\n✅ Vault setup complete!');
  console.log('\nNext steps:');
  console.log(`  1. Open ${expandedVaultPath} in Obsidian`);
  console.log('  2. Start working on a project with Claude Code');
  console.log('  3. Say "document this project" or "log this experiment"');
  console.log('\nThe skill will automatically create and maintain your project notes!\n');

  rl.close();
}

async function install() {
  console.log('🗂️  Obsidian Project Assistant - Install to Existing Vault');
  console.log('=======================================================\n');

  // Detect vault path
  let vaultPath = process.cwd();

  // Check if current directory has .obsidian
  if (!fs.existsSync(path.join(vaultPath, '.obsidian'))) {
    const answer = await question('Current directory is not an Obsidian vault. Enter vault path: ');
    vaultPath = expandPath(answer.trim());

    if (!fs.existsSync(path.join(vaultPath, '.obsidian'))) {
      console.error('❌ Error: Not a valid Obsidian vault (no .obsidian directory found)');
      rl.close();
      process.exit(1);
    }
  }

  console.log(`📁 Installing to vault: ${vaultPath}\n`);

  // Create backup
  console.log('💾 Creating backup...');
  const backupDir = path.join(vaultPath, '.backup', new Date().toISOString().replace(/:/g, '-'));
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`  ✓ Backup directory: ${backupDir}`);

  // Check and create missing directories
  console.log('\n📁 Checking vault structure...');
  const dirs = [
    'Projects',
    'Areas/Hardware',
    'Areas/Software',
    'Areas/Woodworking',
    'Areas/Music Synthesis',
    'Resources',
    'Templates',
    'Daily',
    'Archive'
  ];

  let created = 0;
  for (const dir of dirs) {
    const dirPath = path.join(vaultPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  ✓ Created ${dir}/`);
      created++;
    }
  }

  if (created === 0) {
    console.log('  ✓ All directories already exist');
  }

  // Check and add missing templates
  console.log('\n📝 Checking templates...');
  const skillDir = path.join(__dirname, '..', 'skills', 'obsidian-project-assistant');
  const templatesSource = path.join(skillDir, 'templates');
  const templatesDest = path.join(vaultPath, 'Templates');

  let templatesAdded = 0;
  if (fs.existsSync(templatesSource)) {
    const templates = [
      { src: 'project-template.md', dest: 'Project Template.md' },
      { src: 'experiment-template.md', dest: 'Experiment Template.md' },
      { src: 'daily-note-template.md', dest: 'Daily Note Template.md' }
    ];

    for (const { src, dest } of templates) {
      const srcPath = path.join(templatesSource, src);
      const destPath = path.join(templatesDest, dest);

      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ Added ${dest}`);
        templatesAdded++;
      }
    }
  }

  if (templatesAdded === 0) {
    console.log('  ✓ All templates already exist');
  }

  // Install skill
  console.log('\n🎯 Installing skill...');
  await installSkill(vaultPath);

  // Success message
  console.log('\n✅ Installation complete!');
  console.log('\nThe Obsidian Project Assistant skill is now available in Claude Code.');
  console.log('Start documenting your projects by saying "document this project" or "log this experiment"\n');

  rl.close();
}

async function installSkill(vaultPath) {
  const homeDir = process.env.HOME;
  const skillsDir = path.join(homeDir, '.claude', 'skills');
  const skillName = 'obsidian-project-assistant';
  const skillDestDir = path.join(skillsDir, skillName);

  // Create ~/.claude/skills directory if it doesn't exist
  fs.mkdirSync(skillsDir, { recursive: true });

  // Copy skill files
  const skillSourceDir = path.join(__dirname, '..', 'skills', skillName);

  if (fs.existsSync(skillDestDir)) {
    console.log('  ⚠️  Skill already exists, updating...');
    // Remove old version
    fs.rmSync(skillDestDir, { recursive: true, force: true });
  }

  copyDir(skillSourceDir, skillDestDir);
  console.log(`  ✓ Skill installed to ${skillDestDir}`);

  // Create config file
  const configPath = path.join(skillDestDir, 'config.json');
  const config = {
    vault_path: vaultPath,
    areas: ['Hardware', 'Software', 'Woodworking', 'Music Synthesis'],
    auto_commit: false,
    auto_push: false,
    git_enabled: true
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('  ✓ Configuration created');
}

module.exports = { init, install };
