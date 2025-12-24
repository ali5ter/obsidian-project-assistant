# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code skill that automatically documents technical projects in Obsidian vaults. It's distributed as an NPM package that installs skill files to `~/.claude/skills/obsidian-project-assistant/` and creates/updates notes in a user's Obsidian vault.

**Key Concept**: The skill acts as instructions for Claude Code to detect project context (name, area, type) from the working directory and maintain structured Obsidian notes during conversations.

## Commands

### Build and Test
```bash
# Run tests
npm test

# Install skill locally for testing (creates new vault)
node scripts/install.js init ~/test-vault

# Install to existing vault
cd ~/your-vault
node scripts/install.js install

# Or via npx (as end users would)
npx obsidian-project-assistant init ~/Documents/MyVault
```

### Development Workflow
When testing skill changes:
1. Edit files in `skills/obsidian-project-assistant/`
2. Reinstall to test vault: `node scripts/install.js init ~/test-vault`
3. Start Claude Code in a test project directory
4. Trigger the skill with phrases like "document this project"
5. Verify notes are created/updated in the test vault

## Architecture

### Two-Part System

1. **Installation Scripts** (`scripts/`)
   - `install.js` - CLI entry point, parses args and calls bootstrap functions
   - `bootstrap.js` - Core installation logic for vault setup and skill installation
   - Copies skill files to `~/.claude/skills/obsidian-project-assistant/`
   - Creates vault directory structure (Projects/, Areas/, Templates/, etc.)
   - Generates `config.json` with vault path

2. **Skill Implementation** (`skills/obsidian-project-assistant/`)
   - `SKILL.md` - **Main skill logic** - instructions Claude reads to execute the skill
   - `templates/*.md` - Note templates with `{{placeholder}}` syntax
   - `helpers/*.md` - Reference documentation for context detection rules
   - `config.json` - Generated during installation, contains vault_path

### Execution Flow

When user says "document this project":
1. Claude Code loads `SKILL.md` (the skill's instruction manual)
2. Skill reads `config.json` to get vault path
3. Skill runs bash commands to detect project context (name from git/directory, area from file extensions)
4. Skill loads appropriate template, fills placeholders
5. Skill writes/updates note in vault at `$VAULT_PATH/Projects/[Project Name].md`
6. Optionally commits to git if vault is a repo

### Context Detection Strategy

The skill uses file patterns and bash commands to infer project metadata:

- **Project Name**: Git repo name > directory name > ask user
- **Area Classification**: File extension presence (`.ino` → Hardware, `.js` → Software, `.stl` → Woodworking, `.pd` → Music Synthesis)
- **Description**: Extract from README.md, package.json, or conversation

See `skills/obsidian-project-assistant/helpers/context-detection.md` for complete detection rules.

### Template System

Templates use double-brace placeholders:
- `{{title}}` - Project name
- `{{area}}` - Project area (Hardware/Software/etc.)
- `{{date}}` - ISO 8601 date (YYYY-MM-DD)
- `{{description}}` - Project description

When updating existing notes, the skill appends to the Progress Log section while preserving user content.

## File Structure

```
obsidian-project-assistant/
├── skills/
│   └── obsidian-project-assistant/    # Skill implementation (copied to ~/.claude/skills/)
│       ├── SKILL.md                    # CRITICAL: Claude's instruction manual
│       ├── templates/                  # Note templates (also copied to vault)
│       │   ├── project-template.md
│       │   ├── experiment-template.md
│       │   └── daily-note-template.md
│       └── helpers/                    # Reference docs for SKILL.md
│           ├── context-detection.md    # Detection algorithm details
│           └── area-mapping.md         # File extension mappings
├── scripts/
│   ├── install.js                      # CLI entry point
│   └── bootstrap.js                    # Installation logic
├── test/
│   ├── bootstrap.test.js               # Simple test suite
│   └── fixtures/                       # Test data
├── .claude-plugin/
│   └── plugin.json                     # NPM package metadata
└── package.json                        # NPM package configuration
```

**Important**: The `SKILL.md` file is what Claude Code reads during skill execution. It's not executed code - it's a detailed instruction manual that tells Claude what bash commands to run, what files to read, and how to process information.

## Key Implementation Details

### Installation Architecture
- `bootstrap.js` exports two functions: `init()` for new vaults, `install()` for existing vaults
- Both create the skill directory structure and copy files
- `init()` creates full vault structure, `install()` only adds missing pieces
- Configuration is stored at `~/.claude/skills/obsidian-project-assistant/config.json`

### Skill Invocation
- Activated by keywords in user messages: "document this", "log experiment", "track progress", "update notes"
- Allowed tools: Read, Write, Bash, Glob, Grep (defined in SKILL.md frontmatter)
- Must work from any directory (uses absolute vault paths from config)

### Template Processing
- Templates are first copied to vault's Templates/ folder (with spaces: "Project Template.md")
- Skill reads from `~/.claude/skills/obsidian-project-assistant/templates/` (kebab-case names)
- String replacement for placeholders (simple substitution)
- Date generated via `date +%Y-%m-%d` bash command

### Git Integration
- Optional: controlled by `config.json` fields `git_enabled` and `auto_commit`
- Skill checks if vault is git repo before attempting commits
- Commits include attribution: "Generated with the help of Claude Code Obsidian Project Documentation Assistant"

## Development Practices

### When Modifying SKILL.md
- Changes to SKILL.md affect how Claude behaves during skill execution
- Keep bash commands exact and testable
- Provide concrete examples for each scenario
- Use clear section headers (Claude uses these to navigate)
- Remember: this file is instruction text, not executable code

### When Adding New Area Types
1. Add file extensions to `helpers/area-mapping.md`
2. Add detection bash commands to `helpers/context-detection.md`
3. Update SKILL.md detection section
4. Add area to default config in `bootstrap.js` (line 262)
5. Create test fixture in `test/fixtures/`

### When Modifying Templates
- Keep `{{placeholder}}` syntax consistent
- Templates in `skills/obsidian-project-assistant/templates/` use kebab-case names
- When copied to vault, they get title-cased with spaces
- Maintain frontmatter format (YAML between `---` markers)

### Testing Strategy
- `npm test` runs basic structural tests (file existence, placeholder presence)
- Manual testing required for skill behavior (run Claude Code in test projects)
- Test fixtures in `test/fixtures/` simulate different project types
- Always test with a fresh test vault to avoid state contamination

## Common Tasks

### Adding a New Project Area (e.g., "Photography")

1. Update `skills/obsidian-project-assistant/helpers/area-mapping.md` with file extensions
2. Update `skills/obsidian-project-assistant/helpers/context-detection.md` with detection command
3. Update `skills/obsidian-project-assistant/SKILL.md` detection section
4. Add "Photography" to default areas in `scripts/bootstrap.js:262`
5. Create test fixture: `test/fixtures/photography-project/` with sample files

### Debugging Skill Behavior

1. Check skill is installed: `ls ~/.claude/skills/obsidian-project-assistant/`
2. Verify config: `cat ~/.claude/skills/obsidian-project-assistant/config.json`
3. Test context detection manually: `cd test-project && git rev-parse --show-toplevel`
4. Review SKILL.md to understand what Claude should be doing
5. Check vault permissions: `ls -la ~/path/to/vault/Projects/`

### Publishing Updates

1. Update version in `package.json`
2. Update version in `skills/obsidian-project-assistant/SKILL.md` frontmatter
3. Update version in `.claude-plugin/plugin.json`
4. Run `npm test` to verify
5. Create git tag: `git tag v1.x.x`
6. Publish: `npm publish`

## Important Notes

- Skills execute in the context of Claude Code conversations - they're not standalone programs
- The skill must be robust to being invoked from any directory (always use absolute paths)
- Error handling should gracefully ask users for clarification rather than failing silently
- Preserve user content when updating existing notes (only append to designated sections)
- Config file location: `~/.claude/skills/obsidian-project-assistant/config.json` (not in vault)
- Template placeholder format is strict: `{{key}}` with double braces, no spaces
