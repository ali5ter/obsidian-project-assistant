# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code skill that automatically documents technical projects in Obsidian vaults. It's distributed via git repository with a bash installer that copies skill files to `~/.claude/skills/obsidian-project-documentation-assistant/` and an agent file to `~/.claude/agents/`, enabling automatic documentation of projects in a user's Obsidian vault.

**Key Concept**: The skill acts as instructions for Claude Code to detect project context (name, area, type) from the working directory and spawn an agent that maintains structured Obsidian notes during conversations.

## Commands

### Installation
```bash
# Clone the repository
git clone https://github.com/ali5ter/obsidian-project-assistant.git
cd obsidian-project-assistant

# Install to a vault (creates vault if needed)
./install ~/Documents/MyVault

# Or install from current directory (if you're already in your vault)
cd ~/Documents/MyVault
/path/to/obsidian-project-assistant/install
```

### Development Workflow
When testing skill changes:
1. Edit files in `skill/obsidian-project-documentation-assistant/` or `agent/obsidian-project-documentation-manager.md`
2. Reinstall to test vault: `./install ~/test-vault`
3. Start Claude Code in a test project directory
4. Trigger the skill with phrases like "document this project"
5. Verify notes are created/updated in the test vault

## Architecture

### Two-Part System

1. **Installation** (`install` bash script)
   - Single bash script that handles all installation logic
   - Uses `pfb` library (submodule at `lib/pfb/`) for UI/formatting
   - Copies skill files from `skill/` to `~/.claude/skills/obsidian-project-documentation-assistant/`
   - Copies agent file from `agent/` to `~/.claude/agents/`
   - Generates `config.json` with vault path at `~/.claude/skills/obsidian-project-documentation-assistant/config.json`
   - Optionally initializes git repository in vault

2. **Skill + Agent Implementation**
   - **Skill** (`skill/obsidian-project-documentation-assistant/SKILL.md`) - Lightweight launcher that detects context and spawns agent
   - **Agent** (`agent/obsidian-project-documentation-manager.md`) - Does the actual documentation work
   - **Templates** (`skill/obsidian-project-documentation-assistant/project-template.md`) - Note template with `{{placeholder}}` syntax
   - **Helpers** (`skill/obsidian-project-documentation-assistant/*.md`) - Reference documentation for context detection rules (area-mapping.md, context-detection.md)
   - **Config** - Generated during installation at `~/.claude/skills/obsidian-project-documentation-assistant/config.json`

### Execution Flow (Agent-Based Architecture)

When user says "document this project":
1. Claude Code loads `SKILL.md` (the launcher skill)
2. Launcher reads `config.json` to get vault path
3. Launcher runs quick bash commands to detect project context (name from git/directory, area from file extensions)
4. If context is unclear, launcher asks user questions using AskUserQuestion tool
5. Launcher spawns the custom "obsidian-project-documentation-manager" agent using the Task tool with complete context
6. Agent (running in background) loads appropriate template, fills placeholders
7. Agent writes/updates note in vault at `$VAULT_PATH/Projects/[Project Name].md`
8. Agent commits and optionally pushes to git if configured
9. Agent returns summary to launcher, which reports to user

### Context Detection Strategy

The skill uses file patterns and bash commands to infer project metadata:

- **Project Name**: Git repo name > directory name > ask user
- **Area Classification**: File extension presence (`.ino` → Hardware, `.js` → Software, `.stl` → Woodworking, `.pd` → Music Synthesis)
- **Description**: Extract from README.md, package.json, or conversation

See `skill/obsidian-project-documentation-assistant/context-detection.md` for complete detection rules.

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
├── skill/
│   └── obsidian-project-documentation-assistant/  # Skill files (copied to ~/.claude/skills/)
│       ├── SKILL.md                               # CRITICAL: Launcher that detects context
│       ├── project-template.md                    # Project note template
│       ├── context-detection.md                   # Detection algorithm details
│       └── area-mapping.md                        # File extension mappings
├── agent/
│   └── obsidian-project-documentation-manager.md  # Agent that does documentation work (copied to ~/.claude/agents/)
├── lib/
│   └── pfb/                                       # Pretty Formatting for Bash (submodule)
├── install                                        # Bash installation script
├── CLAUDE.md                                      # This file - AI context
├── README.md                                      # User documentation
└── LICENSE                                        # MIT License
```

**Important**: The `SKILL.md` file is what Claude Code reads during skill execution. It's not executed code - it's a lightweight launcher that:
1. Detects project context using bash commands
2. Asks clarifying questions if needed (using AskUserQuestion tool)
3. Spawns the custom "obsidian-project-documentation-manager" agent (using Task tool) to handle the actual documentation work

The agent file `obsidian-project-documentation-manager.md` contains detailed instructions for creating/updating notes, handling git operations, and managing templates.

This two-phase architecture (launcher skill + custom agent) provides token efficiency and background execution.

## Key Implementation Details

### Installation Architecture
- `install` is a bash script that handles all installation
- Uses `pfb` library (Pretty Formatting for Bash) for UI elements via git submodule
- Takes vault path as argument (defaults to current directory)
- Copies skill directory to `~/.claude/skills/obsidian-project-documentation-assistant/`
- Copies agent file to `~/.claude/agents/obsidian-project-documentation-manager.md`
- Generates `config.json` at `~/.claude/skills/obsidian-project-documentation-assistant/config.json`
- Checks if vault exists and is initialized by Obsidian (looks for `.obsidian/` directory)
- Optionally initializes git repository in vault if not present
- Updates `git_enabled` config based on user choices

### Skill Invocation
- Activated by keywords in user messages: "document this", "log experiment", "track progress", "update notes"
- Launcher allowed tools: Read, Bash, AskUserQuestion, Task (defined in SKILL.md frontmatter)
- Agent has access to all tools needed for documentation (Read, Write, Bash, etc.)
- Must work from any directory (uses absolute vault paths from config)
- Background execution: Agent runs asynchronously, doesn't block main conversation

### Agent-Based Architecture (v1.1.0+)

The skill uses a two-phase architecture for token efficiency and background execution:

**Phase 1: Launcher (SKILL.md)**
- Loads configuration from `config.json`
- Detects project context (name, area, description) using bash commands
- Asks clarifying questions if context is ambiguous (AskUserQuestion tool)
- Prepares agent prompt with complete context
- Spawns custom agent using Task tool with subagent_type="obsidian-project-documentation-manager"

**Phase 2: Agent (Background)**
- Receives complete context and instructions from launcher
- Loads appropriate template based on task type
- Creates or updates notes in vault
- Handles git operations (commit, push) based on config
- Returns summary of operations performed

**Benefits:**
- **Token Efficiency**: Launcher is ~200 lines vs ~800 lines in previous monolithic approach
- **Background Execution**: Agent runs asynchronously, user can continue working
- **Separation of Concerns**: Context detection separate from documentation work
- **Better UX**: Questions asked upfront, then work happens transparently
- **Scalability**: Easy to add new documentation types without bloating launcher

**Agent Prompt Structure:**
- Context variables (vault path, project name, area, dates, config settings)
- Task-specific instructions (create vs update, project vs experiment)
- Git operation rules based on config
- Template paths and placeholder mappings
- Expected output format

### Template Processing
- Template is stored at `~/.claude/skills/obsidian-project-documentation-assistant/project-template.md`
- Agent reads template and performs string replacement for placeholders (simple substitution)
- Date generated via `date +%Y-%m-%d` bash command
- Placeholders: `{{title}}`, `{{area}}`, `{{date}}`, `{{description}}`

### Git Integration
- Optional: controlled by `config.json` fields `git_enabled`, `auto_commit`, and `auto_push`
- Skill checks if vault is git repo before attempting commits
- If `auto_push` is true, automatically pushes to remote after committing
- If `auto_push` is false, asks user before pushing
- Commits include attribution: "Generated with the help of Claude Code Obsidian Project Documentation Assistant"

## Development Practices

### Agent Reliability Improvements (v2.1.0 - 2025-12-31)

The agent was significantly improved to ensure reliable execution of all documentation steps, especially when documenting the tool itself (meta-documentation scenario):

**Key Improvements:**
- **TodoWrite Tracking**: Agent now creates a visible task list with all 7 steps at the start of execution
- **Meta-Documentation Awareness**: Special handling when working directory contains "obsidian-project-assistant"
  - Detects self-documentation scenarios
  - Ensures BOTH vault note AND repository's CLAUDE.md are updated
  - Step 4 is explicitly marked as CRITICAL with validation requirements
- **Structured Reporting**: Step 7 requires reporting completion status for ALL steps with explicit explanations for any skipped steps
- **Error Handling Protocol**: Agent must STOP and report errors clearly instead of silently skipping steps
- **Step Validation**: After critical steps (especially CLAUDE.md updates), agent re-reads files to verify changes were written correctly

**Testing Approach:**
- The 2025-12-31 session served as the critical test case
- Previous session (2025-12-30 refactoring) had failed to update CLAUDE.md
- Improvements were tested by triggering agent with "Let's wrap up this session"
- Verified all 7 steps execute correctly including CLAUDE.md updates

**Known Issues Fixed:**
- Step numbering inconsistency (was 1,3-8, corrected to 1-7)
- Silent failures when updating repository documentation
- Missing TodoWrite visibility for users

### Critical Bug Fix: CLAUDE.md Creation Logic (v2.1.1 - 2026-01-02)

A critical bug was discovered and fixed in the agent's Step 4 (AI Context files) logic:

**The Bug:**
- Agent Step 4 would only UPDATE existing CLAUDE.md files
- If CLAUDE.md didn't exist, the agent would silently skip creation
- This meant projects were missing AI context documentation entirely
- The bug went undetected because the agent would report "CLAUDE.md not found" and continue to Step 5

**Root Cause:**
- Step 4 had a single-branch if-then logic: "if CLAUDE.md exists, update it"
- No else branch to handle creation when file was missing
- The CRITICAL label emphasized updating but not creating
- Error handling instruction was to "note this in final summary but continue" which allowed silent skipping

**The Fix (commit 8ea4fcf):**
Updated `agent/obsidian-project-documentation-manager.md` Step 4 with comprehensive two-branch logic:

1. **If CLAUDE.md exists** (18 lines → 23 lines):
   - Check specifically for `CLAUDE.md` (not CLAUDE_SYSTEM_PROMPT.md or other variants)
   - Read current content and analyze what needs updating based on session context
   - Update with architectural changes, new features, structure changes
   - Re-read file to verify changes were written correctly

2. **If CLAUDE.md does NOT exist** (new branch, +9 lines):
   - CREATE new CLAUDE.md with comprehensive AI project context:
     - What the project is (overview and purpose)
     - Project structure (key directories and files)
     - How to work on it (build commands, testing, development workflow)
     - Important technical details or conventions
   - Applies to ALL project types, not just code projects

3. **Improved error handling**:
   - Changed from "note in summary but continue" to "STOP and report error clearly"
   - Prevents silent failures that skip documentation steps

**Testing:**
- This documentation session itself verifies the fix works
- Agent should now create CLAUDE.md for projects currently lacking AI context files
- Future sessions on new projects will have proper context handoff

**Impact:**
- Fixes significant gap where projects were missing AI context documentation
- Improves handoff between work sessions when Claude needs project background
- Makes agent more proactive about maintaining complete documentation set
- Ensures consistency across all documented projects

### When Modifying SKILL.md
- Changes to SKILL.md affect how Claude behaves during skill execution
- Keep bash commands exact and testable
- Provide concrete examples for each scenario
- Use clear section headers (Claude uses these to navigate)
- Remember: this file is instruction text, not executable code

### When Adding New Area Types
1. Add file extensions to `skill/obsidian-project-documentation-assistant/area-mapping.md`
2. Add detection bash commands to `skill/obsidian-project-documentation-assistant/context-detection.md`
3. Update `skill/obsidian-project-documentation-assistant/SKILL.md` detection section
4. Add area to default config in `install` script (around line 63-64)
5. Test manually with a project containing those file types

### When Modifying Templates
- Keep `{{placeholder}}` syntax consistent
- Template is at `skill/obsidian-project-documentation-assistant/project-template.md`
- Maintain frontmatter format (YAML between `---` markers)
- Agent performs direct string replacement, so placeholders must match exactly

### Testing Strategy
- Manual testing required for skill behavior (run Claude Code in test projects)
- Create test projects with different file types to verify area detection
- Test with a dedicated test vault to avoid contaminating production notes
- Verify git operations work correctly (commit, push) with test vault

## Common Tasks

### Adding a New Project Area (e.g., "Photography")

1. Update `skill/obsidian-project-documentation-assistant/area-mapping.md` with file extensions
2. Update `skill/obsidian-project-documentation-assistant/context-detection.md` with detection command
3. Update `skill/obsidian-project-documentation-assistant/SKILL.md` detection section
4. Add "Photography" to default areas in `install` script (around line 63)
5. Test with a sample photography project containing relevant file types (.raw, .jpg, etc.)

### Debugging Skill Behavior

1. Check skill is installed: `ls ~/.claude/skills/obsidian-project-documentation-assistant/`
2. Check agent is installed: `ls ~/.claude/agents/obsidian-project-documentation-manager.md`
3. Verify config: `cat ~/.claude/skills/obsidian-project-documentation-assistant/config.json`
4. Test context detection manually: `cd test-project && git rev-parse --show-toplevel`
5. Review SKILL.md to understand launcher behavior
6. Review agent file to understand documentation logic
7. Check vault permissions: `ls -la ~/path/to/vault/Projects/`

### Publishing Updates

1. Update version in `skill/obsidian-project-documentation-assistant/SKILL.md` frontmatter
2. Update CHANGELOG.md (if it exists) with changes
3. Test installation with `./install ~/test-vault`
4. Verify skill and agent work correctly
5. Commit changes: `git commit -am "Version bump and changes"`
6. Create git tag: `git tag v1.x.x`
7. Push to GitHub: `git push origin main --tags`

## Important Notes

- Skills execute in the context of Claude Code conversations - they're not standalone programs
- The skill must be robust to being invoked from any directory (always use absolute paths)
- Error handling should gracefully ask users for clarification rather than failing silently
- Preserve user content when updating existing notes (only append to designated sections)
- Config file location: `~/.claude/skills/obsidian-project-documentation-assistant/config.json` (not in vault)
- Agent file location: `~/.claude/agents/obsidian-project-documentation-manager.md`
- Template placeholder format is strict: `{{key}}` with double braces, no spaces
