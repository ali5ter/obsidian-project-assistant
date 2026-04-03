# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code plugin (v3.2.0) that automatically documents technical projects in Obsidian vaults. It's distributed via the Claude Code native plugin framework — users install it with two `/plugin` commands in Claude Code. No bash installer or manual file copying is needed.

**Key Concept**: The skill acts as instructions for Claude Code to detect project context (name, area, type) from the working directory and spawn an agent that maintains structured Obsidian notes during conversations.

## Commands

### Installation (Claude Code plugin framework)
```
/plugin marketplace add ali5ter/claude-plugins
/plugin install obsidian-project-documentation@ali5ter
```

First trigger of the skill prompts for vault path — no separate setup step needed.

### Migration from v2.x (bash-installer users)
```bash
git pull
./migrate
```
Then run the two `/plugin` commands above.

### Uninstall
```
/plugin uninstall obsidian-project-documentation@ali5ter
```

### Development Workflow
When testing skill changes:
1. Edit files in `skills/obsidian-project-documentation/` or `agents/manager.md`
2. Reinstall plugin locally to test
3. Start Claude Code in a test project directory
4. Trigger the skill with phrases like "document this project"
5. Verify notes are created/updated in the test vault

## Architecture

### Two-Part System

1. **Plugin Manifest** (`.claude-plugin/`)
   - `plugin.json` — plugin metadata (name, version, author, keywords)

2. **Skill + Agent Implementation**
   - **Skill** (`skills/obsidian-project-documentation/SKILL.md`) - Two-path launcher: Path A orients the user (read-only, no agent), Path B detects context and spawns the manager agent
   - **Agent** (`agents/manager.md`) - Does the actual documentation work
   - **Templates** (`skills/obsidian-project-documentation/project-template.md`) - Note template with `{{placeholder}}` syntax
   - **Helpers** (`skills/obsidian-project-documentation/*.md`) - Reference documentation for context detection rules (area-mapping.md, context-detection.md)
   - **Config** - Written on first use to `~/.claude/obsidian-project-assistant-config.json`

### Execution Flow (Agent-Based Architecture)

When user says "document this project":
1. Claude Code loads `SKILL.md` (the launcher skill)
2. Launcher reads `config.json` to get vault path
3. Launcher runs quick bash commands to detect project context (name from git/directory, area from file extensions)
4. If context is unclear, launcher asks user questions using AskUserQuestion tool
5. Launcher spawns the custom "manager" agent using the Task tool with complete context
6. Agent (running in background) loads appropriate template, fills placeholders
7. Agent writes/updates note in vault at `$VAULT_PATH/Projects/[Project Name].md`
8. Agent commits and optionally pushes to git if configured
9. Agent returns summary to launcher, which reports to user

### Context Detection Strategy

The skill uses file patterns and bash commands to infer project metadata:

- **Project Name**: Git repo name > directory name > ask user
- **Area Classification**: File extension presence (`.ino` → Hardware, `.js` → Software, `.stl` → Woodworking, `.pd` → Music Synthesis)
- **Description**: Extract from README.md, package.json, or conversation

See `skills/obsidian-project-documentation/context-detection.md` for complete detection rules.

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
├── .claude-plugin/
│   └── plugin.json                                # Plugin metadata (name, version, author)
├── skills/
│   └── obsidian-project-documentation/  # Skill files
│       ├── SKILL.md                               # CRITICAL: Launcher that detects context
│       ├── project-template.md                    # Project note template
│       ├── context-detection.md                   # Detection algorithm details
│       └── area-mapping.md                        # File extension mappings
├── agents/
│   └── manager.md  # Agent that does documentation work
├── migrate                                        # Migration script (v2.x → v3.x)
├── install                                        # DEPRECATED: redirects to /plugin commands
├── CLAUDE.md                                      # This file - AI context
├── README.md                                      # User documentation
└── LICENSE                                        # MIT License
```

**Important**: The `SKILL.md` file is what Claude Code reads during skill execution. It's not executed code — it runs one of two paths:

- **Path A (session-start / orientation):** Reads the existing vault note and `CLAUDE.md`, summarises project state for the user. Never launches the agent. Used when Alister asks "where were we?" or similar.
- **Path B (documentation run):** Detects project context using bash commands, asks clarifying questions if needed (AskUserQuestion tool), then spawns the manager agent (Task tool) to perform the documentation work.

The agent file `manager.md` contains detailed instructions for creating/updating notes, handling git operations, and managing templates.

This two-phase architecture (launcher skill + custom agent) provides token efficiency and background execution.

## Key Implementation Details

### Plugin Architecture (v3.0.0+)
- Distributed via Claude Code native plugin framework (`/plugin marketplace add`, `/plugin install`)
- Plugin manifest at `.claude-plugin/plugin.json` (name, version, author, keywords)
- `install` script is deprecated — shows redirect message pointing to `/plugin` commands
- `migrate` script handles v2.x → v3.x migration: preserves config, removes old files

### Config Location (v3.0.0+)
- Config file: `~/.claude/obsidian-project-assistant-config.json`
- Created automatically on first use by SKILL.md first-run setup (asks user for vault path)
- Previously was at `~/.claude/skills/obsidian-project-documentation/config.json`

### Skill Invocation
- Activated by keywords in user messages: "document this", "log experiment", "track progress", "update notes"
- Launcher allowed tools: Read, Bash, AskUserQuestion, Task (defined in SKILL.md frontmatter)
- Agent has access to all tools needed for documentation (Read, Write, Bash, etc.)
- Must work from any directory (uses absolute vault paths from config)
- Background execution: Agent runs asynchronously, doesn't block main conversation

### Agent-Based Architecture (v1.1.0+)

The skill uses a two-phase architecture for token efficiency and background execution:

**Phase 1: Launcher (SKILL.md)**
- Loads configuration from `~/.claude/obsidian-project-assistant-config.json`
- On first run (config missing): asks user for vault path via AskUserQuestion, writes config
- Detects project context (name, area, description) using bash commands
- Asks clarifying questions if context is ambiguous (AskUserQuestion tool)
- Prepares agent prompt with complete context
- Spawns custom agent using Task tool with subagent_type="manager"

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
- Template is stored at `~/.claude/plugins/cache/ali5ter/obsidian-project-documentation/<version>/skills/obsidian-project-documentation/project-template.md` (plugin framework cache location)
- Agent reads template and performs string replacement for placeholders (simple substitution)
- Date generated via `date +%Y-%m-%d` bash command, time via `date +%H:%M`
- Placeholders: `{{title}}`, `{{area}}`, `{{area_tag}}`, `{{date}}`, `{{time}}`, `{{phase}}`, `{{description}}`
  - `{{area_tag}}`: area value converted to lowercase with hyphens (e.g., "Music Synthesis" → "music-synthesis")
  - `{{phase}}`: evaluated from `Planning → Implementing → Testing → Complete` progression
  - `{{time}}`: 24-hour HH:MM timestamp for the session start
- Template frontmatter includes `technologies: []` and `related: []` arrays populated by the agent each session
- Template includes a "Related Projects" section maintained automatically between Overview and Goals
- When updating existing notes, the agent appends a new Update section while preserving all user content

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
Updated `agents/manager.md` Step 4 with comprehensive two-branch logic:

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

### Critical Bug Fix: Skill Name Mismatch (v2.1.2 - 2026-01-04)

A critical naming conflict was discovered and fixed that prevented the skill from being triggered correctly:

**The Bug:**
- Two different skill versions installed simultaneously with conflicting names:
  - Old v1.1.0: `~/.claude/skills/obsidian-project-assistant/` with skill name "obsidian-project-assistant"
  - Current v2.1.1: `~/.claude/skills/obsidian-project-documentation/` with skill name "obsidian-project-assistant" (INCORRECT)
- SKILL.md frontmatter had incorrect name that didn't match its directory name
- Claude Code couldn't unambiguously determine which skill to invoke
- Trigger phrases like "wrap this up" or "document this" failed due to ambiguity

**Root Cause:**
- Line 2 of `skills/obsidian-project-documentation/SKILL.md` had `name: "obsidian-project-assistant"`
- Should have been `name: "obsidian-project-documentation"` to match directory structure
- This created a naming conflict when both skill versions were installed
- Old v1.1.0 installation was never properly removed during upgrade to v2.x

**The Fix:**
1. Updated `skills/obsidian-project-documentation/SKILL.md` frontmatter:
   - Changed name from "obsidian-project-assistant" to "obsidian-project-documentation"
   - Ensures skill name matches directory name for consistency
2. Removed old v1.1.0 skill installation:
   - Deleted `~/.claude/skills/obsidian-project-assistant/` directory entirely
   - Eliminated naming conflict at source
3. Reinstalled skill with corrected configuration:
   - Ran `./install /Users/alister/Documents/ObsidianVault`
   - Verified single, unambiguous skill installation

**Technical Details:**
- Skill names must be unique across `~/.claude/skills/` directory
- Claude Code matches trigger phrases to skill names from SKILL.md frontmatter
- Ambiguous names cause invocation failures with no clear error message
- **Best practice**: Skill name in frontmatter should match directory name for clarity and uniqueness

**Testing:**
- Verified only one skill installation exists in `~/.claude/skills/`
- Confirmed frontmatter name matches directory structure
- Skill now triggers reliably with natural language phrases

**Impact:**
- Fixes inability to trigger documentation skill with natural language
- Ensures reliable skill invocation going forward
- Eliminates confusion from multiple installed versions
- Establishes clearer naming convention for skill identification
- Users upgrading from v1.x should remove old installation directory manually

### Cross-Project Relationship Analysis (v2.2.0 - 2026-03-02)

Agent Step 2 was added to build knowledge connections across the vault automatically. The agent now:

1. **Extracts canonical technologies** from the session conversation and dependency files (package.json, requirements.txt, etc.), matched against the lookup tables in `area-mapping.md`
2. **Scans existing vault notes** - reads first 30 lines of each note in `$VAULT_PATH/Projects/` (token-efficient)
3. **Scores relationship candidates** using a points system:
   - Same `area:` value → 1 point
   - Each overlapping technology → 3 points each
   - Complementary cross-area pairing → 3 points
   - Project name mentioned in current session → 5 points
   - Threshold: ≥ 3 points required (same-area alone is not enough)
4. **Writes relationship data** back to the current note:
   - `technologies:` frontmatter array with canonical names
   - `related:` frontmatter array as `["[[Project A]]", "[[Project B]]"]`
   - "Related Projects" section in note body with one line per link and reason phrase
   - Both arrays fully rewritten each session (stale links removed automatically)

**Design constraints:**
- Never link to a note that does not exist in the vault
- Do not fabricate connection reasons
- 30-line scan limit keeps token cost bounded as vault grows

**Template changes (v2.2.0):**
- New frontmatter fields: `tags: [project, project/{{area_tag}}]`, `technologies: []`, `related: []`
- New "Related Projects" section in note body (agent-maintained, between Overview and Goals)
- "Reference Links" section now explicitly for external URLs only

**Area mapping changes (v2.2.0):**
- `area-mapping.md` now includes "Canonical Technology Names for Relationship Matching" section
- Per-area lookup tables map aliases and file extensions to consistent canonical names

### Plugin Framework Migration (v3.0.0 - 2026-03-02)

Migrated distribution from bash installer to Claude Code native plugin framework:

**Changes:**
- `skill/` renamed → `skills/`, `agent/` renamed → `agents/` (plugin framework conventions)
- `.claude-plugin/plugin.json` created
- `lib/pfb` submodule removed (only served the deprecated bash installer)
- `install` script replaced with deprecation notice pointing to `/plugin` commands
- `migrate` script added to handle v2.x → v3.x user migration
- Config location changed from `~/.claude/skills/obsidian-project-documentation/config.json` to `~/.claude/obsidian-project-assistant-config.json`
- SKILL.md updated with first-run setup: asks user for vault path on first use (no separate install step)

**User migration path:**
1. `git pull && ./migrate` — preserves config, removes old files
2. `/plugin marketplace add ali5ter/claude-plugins`
3. `/plugin install obsidian-project-documentation@ali5ter`

### Post-Migration Bug Fixes (v3.0.1 - 2026-03-02)

Two bugs discovered and fixed during live testing of the v3.0.0 plugin framework installation:

**Bug 1: Agent subagent_type namespace (commit cac5ba7)**

When installed via the Claude Code plugin framework, `subagent_type` in SKILL.md must include the plugin namespace prefix:

- Wrong: `subagent_type: manager`
- Correct: `subagent_type: obsidian-project-documentation:manager`

The namespace prefix is required in plugin-installed deployments. Bare agent names only work in development (manually placed agents). This is a framework-level requirement and must be respected in any future agent additions.

**Bug 2: Tag/version ordering in release workflow**

The plugin framework caches the plugin using the git tag. If you tag before committing the updated version number in `plugin.json`, the cache is populated with the wrong version. Always follow the order in the "Publishing Updates" section: bump → commit → tag → push.

The v3.0.1 tag was moved to the correct commit and the GitHub release was recreated.

### Central Marketplace Migration (v3.0.1 - 2026-03-18)

The plugin's marketplace registration was migrated from a self-hosted `marketplace.json` inside this repository's `.claude-plugin/` directory to the central `ali5ter/claude-plugins` marketplace hosted at a dedicated GitHub repo.

**What changed:**

- Installation command updated to reference the central marketplace:

  ```
  /plugin marketplace add ali5ter/claude-plugins
  /plugin install obsidian-project-documentation@ali5ter
  ```

- `README.md`, `CLAUDE.md`, `install`, and `migrate` updated (commits `3479ba6`, `160c943`)
- No functional changes to the skill or agent

**Note on `.claude-plugin/marketplace.json`:**

The commit message for `160c943` states this file should be removed (superseded by the central marketplace), but the deletion was not staged. The file remains present. It can be safely deleted in a future cleanup commit — it no longer drives plugin discovery.

**Why centralise:**

Managing multiple plugins (e.g. `over-50s-health-advisor`, `obsidian-project-documentation`) is easier from a single `ali5ter/claude-plugins` repo. This mirrors the thin-catalog architecture used by `anthropics/claude-plugins-official`.

### When Modifying SKILL.md
- Changes to SKILL.md affect how Claude behaves during skill execution
- Keep bash commands exact and testable
- Provide concrete examples for each scenario
- Use clear section headers (Claude uses these to navigate)
- Remember: this file is instruction text, not executable code

### When Adding New Area Types
1. Add file extensions to `skills/obsidian-project-documentation/area-mapping.md`
2. Add detection bash commands to `skills/obsidian-project-documentation/context-detection.md`
3. Update `skills/obsidian-project-documentation/SKILL.md` detection section
4. Add area to default config written by SKILL.md first-run setup
5. Test manually with a project containing those file types

### When Modifying Templates
- Keep `{{placeholder}}` syntax consistent
- Template is at `skills/obsidian-project-documentation/project-template.md`
- Maintain frontmatter format (YAML between `---` markers)
- Agent performs direct string replacement, so placeholders must match exactly

### Testing Strategy
- Manual testing required for skill behavior (run Claude Code in test projects)
- Create test projects with different file types to verify area detection
- Test with a dedicated test vault to avoid contaminating production notes
- Verify git operations work correctly (commit, push) with test vault

## Common Tasks

### Adding a New Project Area (e.g., "Photography")

1. Update `skills/obsidian-project-documentation/area-mapping.md` with file extensions
2. Update `skills/obsidian-project-documentation/context-detection.md` with detection command
3. Update `skills/obsidian-project-documentation/SKILL.md` detection section
4. Add "Photography" to the default areas list in SKILL.md first-run setup
5. Test with a sample photography project containing relevant file types (.raw, .jpg, etc.)

### Debugging Skill Behavior

1. Check plugin is installed: `/plugin list` in Claude Code
2. Verify config: `cat ~/.claude/obsidian-project-assistant-config.json`
3. Test context detection manually: `cd test-project && git rev-parse --show-toplevel`
4. Review `skills/obsidian-project-documentation/SKILL.md` to understand launcher behavior
5. Review `agents/manager.md` to understand documentation logic
6. Check vault permissions: `ls -la ~/path/to/vault/Projects/`

### Publishing Updates

CRITICAL ORDER — bump versions and commit BEFORE creating the git tag. The plugin framework caches by tag, so the tag must point at the commit that already contains the updated version numbers.

1. Update version in `skills/obsidian-project-documentation/SKILL.md` frontmatter
2. Update version in `.claude-plugin/plugin.json`
3. Verify skill and agent work correctly
4. Commit changes: `git commit -am "Version bump and changes"` (version numbers must be in this commit)
5. Create git tag pointing at the version-bump commit: `git tag v3.x.x`
6. Push to GitHub: `git push origin main --tags`
7. Run `/plugin marketplace update ali5ter` in Claude Code before installing — the installer
   uses a cached catalog and will not see the new version without an explicit update.

### Improvements and Bug Fixes (v3.2.0 - 2026-04-03)

Six PRs addressing bugs and improvements identified in a deep review against Claude Code best practices:

**Bug fixes:**
- Removed duplicate `vca` keyword in `area-mapping.md` (#8)
- Fixed wrong skill name in `manager.md` description (#6)
- Standardised `GIT_REMOTE` naming in `manager.md` Step 6 (#4)
- Replaced stale `~/.claude/skills/` template/area-mapping paths with dynamic `find` commands targeting the plugin cache (#3)
- Added `{{time}}`, `{{phase}}`, and `{{area_tag}}` to the explicit placeholder list in `manager.md` Step 1 (#5, #16)

**Architecture improvements:**
- `SKILL.md` split into **Path A** (session-start, read-only) and **Path B** (documentation run). Path A reads vault note + CLAUDE.md and orients the user; it never launches the agent (#13)
- Added explicit agent prompt template to `SKILL.md` Step B3, enumerating all 10 context variables and their sources (#7)
- Replaced sequential `if/elif` area detection with parallel match-count algorithm; extension lists expanded to match `context-detection.md` (#15)
- `manager.md` Step 4 (README/CONTRIBUTING) now has a scope guard (only runs on structural session changes), requires user confirmation before touching README.md, excludes LICENSE entirely (#14)

**Agent frontmatter hardened (#9, #10, #11, #17):**
- `tools` allowlist: `Read, Write, Edit, Bash, TodoWrite, AskUserQuestion, Glob, Grep`
- `maxTurns: 50`
- `background: true`
- `permissionMode: acceptEdits`

## Important Notes

- Skills execute in the context of Claude Code conversations - they're not standalone programs
- The skill must be robust to being invoked from any directory (always use absolute paths)
- Error handling should gracefully ask users for clarification rather than failing silently
- Preserve user content when updating existing notes (only append to designated sections)
- Config file location: `~/.claude/obsidian-project-assistant-config.json` (not in vault, created on first use)
- Agent installed by plugin framework into `~/.claude/agents/` automatically
- Template placeholder format is strict: `{{key}}` with double braces, no spaces
