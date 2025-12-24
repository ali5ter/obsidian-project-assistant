---
name: obsidian-project-assistant
description: Document technical projects in Obsidian vault. Use when user mentions "document this", "log experiment", "update notes", "track progress", or discusses maintaining project documentation, experiment logs, or work progress in Obsidian.
version: 1.0.0
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Obsidian Project Documentation Assistant

This skill helps maintain project documentation in an Obsidian vault while working with Claude Code. It automatically captures project progress, experiments, and insights into structured notes.

## How This Works

When activated, this skill:

1. Detects the current project context (name, area, type)
2. Creates or updates notes in the configured Obsidian vault
3. Maintains consistent formatting using templates
4. Optionally commits changes to git

## Configuration

Load config from `~/.claude/skills/obsidian-project-assistant/config.json`:

```bash
cat ~/.claude/skills/obsidian-project-assistant/config.json
```

Expected format:

```json
{
  "vault_path": "/path/to/ObsidianVault",
  "areas": ["Hardware", "Software", "Woodworking", "Music Synthesis"],
  "auto_commit": false,
  "git_enabled": true
}
```

If config doesn't exist, ask user for vault path and create it.

## Context Detection

### 1. Detect Project Name

**Priority order:**

1. **Explicit user statement** - User says "working on [project name]"
2. **Git repository** - Check if cwd is a git repo:

   ```bash
   git rev-parse --is-inside-work-tree 2>/dev/null && basename $(git rev-parse --show-toplevel)
   ```

   Transform kebab-case → Title Case (e.g., "my-project" → "My Project")

3. **Directory name** - Current directory or parent if current is generic (src/, build/, etc.):

   ```bash
   basename $(pwd)
   ```

4. **Ask user** - If ambiguous or unclear, ask: "What would you like to name this project?"

### 2. Detect Area (Hardware/Software/Woodworking/Music Synthesis)

**Check for file patterns:**

```bash
# Hardware indicators
find . -maxdepth 2 -type f \( -name "*.ino" -o -name "*.cpp" -o -name "platformio.ini" -o -name "*.pcb" -o -name "*.sch" \) 2>/dev/null | head -1

# Software indicators
find . -maxdepth 2 -type f \( -name "package.json" -o -name "requirements.txt" -o -name "Cargo.toml" -o -name "go.mod" -o -name "*.py" -o -name "*.js" -o -name "*.ts" \) 2>/dev/null | head -1

# Woodworking indicators
find . -maxdepth 2 -type f \( -name "*.stl" -o -name "*.obj" -o -name "*.blend" -o -name "*.f3d" \) 2>/dev/null | head -1

# Music Synthesis indicators
find . -maxdepth 2 -type f \( -name "*.pd" -o -name "*.maxpat" -o -name "*.syx" -o -name "*.fxp" \) 2>/dev/null | head -1
```

**Classification:**

- Hardware: .ino, .cpp (Arduino/embedded), platformio.ini, .pcb, .sch
- Software: .js, .ts, .py, .go, .rs, package.json, requirements.txt
- Woodworking: .stl, .obj, .blend, .f3d (CAD files)
- Music Synthesis: .pd (Pure Data), .maxpat (Max/MSP), .syx, .fxp

If multiple matches or unclear, ask user to confirm area.

### 3. Extract Description from Conversation

Parse the conversation for project description:

- Look for user statements about what they're building
- Extract from README.md if it exists
- Use package.json description field if available
- Default to empty and let user fill in

## Creating Project Notes

### Step 1: Check if Project Note Exists

```bash
VAULT_PATH="<from config>"
PROJECT_NAME="<detected name>"
NOTE_PATH="$VAULT_PATH/Projects/$PROJECT_NAME.md"

if [ -f "$NOTE_PATH" ]; then
  echo "Project note exists, will update"
else
  echo "Creating new project note"
fi
```

### Step 2: Load Template

Read template from skill directory:

```bash
cat ~/.claude/skills/obsidian-project-assistant/templates/project-template.md
```

### Step 3: Fill Template Placeholders

Replace placeholders with detected values:

- `{{title}}` → Detected project name
- `{{date}}` → Current date in YYYY-MM-DD format (use `date +%Y-%m-%d`)
- `{{area}}` → Detected area
- `{{description}}` → Extracted description (or leave blank)

### Step 4: Write to Vault

**If new project:**
Write complete template to vault location.

**If existing project:**

- Preserve existing content
- Append to Progress Log section:

  ```markdown
  ### YYYY-MM-DD
  [Summary of today's work from conversation]
  ```

- Update `updated:` field in frontmatter

### Step 5: Confirm Creation

Tell user:

```text
Created/updated project note: ~/Documents/ObsidianVault/Projects/[Project Name].md
```

## Creating Experiment Notes

When user says "log this experiment" or discusses experimental results:

### Step 1: Load Experiment Template

```bash
cat ~/.claude/skills/obsidian-project-assistant/templates/experiment-template.md
```

### Step 2: Fill Template

- `{{title}}` → Experiment name (ask user or infer from conversation)
- `{{date}}` → Current date
- `{{area}}` → Same as parent project
- `{{project}}` → Link to parent project
- Fill hypothesis, observations, conclusions from conversation

### Step 3: Write to Vault

Create file: `$VAULT_PATH/Projects/YYYY-MM-DD - [Experiment Name].md`

Or organize under project if user prefers.

## Git Integration

If `git_enabled` is true in config:

### Step 1: Check if Vault is a Git Repo

```bash
cd $VAULT_PATH
git rev-parse --git-dir > /dev/null 2>&1
```

### Step 2: Ask Before Committing

Unless `auto_commit` is true, ask user:

```text
Would you like me to commit these changes to the vault?
- Yes, commit the changes
- No, just leave them uncommitted
```

### Step 3: Create Meaningful Commit

```bash
cd $VAULT_PATH
git add "Projects/[Project Name].md"
git commit -m "Update [Project Name] project notes

- Added progress log entry for $(date +%Y-%m-%d)
- [Brief summary of changes]

🤖 Generated with the help of Claude Code Obsidian Project Documentation Assistant"
```

## Usage Examples

### Example 1: Starting a New Project

**User:** "I'm building an Arduino temperature sensor. Can you help document this project?"

**Actions:**

1. Detect project name: "Arduino Temperature Sensor" (from conversation)
2. Detect area: Hardware (find .ino files in cwd)
3. Load project template
4. Fill template with detected values
5. Write to `~/Documents/ObsidianVault/Projects/Arduino Temperature Sensor.md`
6. Confirm creation

### Example 2: Updating Existing Project

**User:** "I just got the I2C communication working. Update my project notes."

**Actions:**

1. Detect current project (from cwd or recent context)
2. Read existing project note
3. Append to Progress Log:

   ```markdown
   ### 2025-12-23
   Successfully implemented I2C communication for sensor readings.
   ```

4. Update `updated:` frontmatter field
5. Ask about git commit

### Example 3: Logging an Experiment

**User:** "Log this experiment - I tested three different capacitor values for filtering"

**Actions:**

1. Load experiment template
2. Fill with conversation details:
   - Hypothesis: Testing capacitor values for noise filtering
   - Setup: Tried 0.1µF, 1µF, and 10µF capacitors
   - Observations: [extracted from conversation]
3. Create experiment note
4. Link to parent project

## Helper References

For detailed context detection rules, see:

- `helpers/context-detection.md` - Full detection logic
- `helpers/area-mapping.md` - Complete file extension mappings

## Important Notes

- Always preserve user-written content when updating notes
- Ask for confirmation when unsure about project name or area
- Use absolute paths for vault access: `~/Documents/ObsidianVault` works from any directory
- Respect existing note structure - only update automated sections
- If config doesn't exist, help user create it interactively
