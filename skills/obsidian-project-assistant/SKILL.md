---
name: obsidian-project-assistant
description: Document technical projects in Obsidian vault. Use when user mentions "document this", "log experiment", "update notes", "track progress", or discusses maintaining project documentation, experiment logs, or work progress in Obsidian.
version: 1.1.0
allowed-tools: Read, Bash, AskUserQuestion, Task
---

# Obsidian Project Documentation Assistant

This skill helps maintain project documentation in an Obsidian vault while working with Claude Code. It automatically captures project progress, experiments, and insights into structured notes.

**Architecture:** This skill acts as a lightweight launcher that detects project context, asks clarifying questions if needed, then launches an agent to handle the documentation work in the background.

## How This Works

When activated, this skill:

1. Loads configuration from `~/.claude/skills/obsidian-project-assistant/config.json`
2. Detects project context (name, area, type) from current directory
3. Asks user for clarification if context is ambiguous
4. Launches a documentation agent with the detected context
5. The agent creates/updates notes, handles git operations, and returns results

## Step 1: Load Configuration

```bash
cat ~/.claude/skills/obsidian-project-assistant/config.json
```

Expected format:
```json
{
  "vault_path": "/path/to/ObsidianVault",
  "areas": ["Hardware", "Software", "Woodworking", "Music Synthesis"],
  "auto_commit": false,
  "auto_push": false,
  "git_enabled": true
}
```

If config doesn't exist, inform user they need to reinstall the skill:
```bash
cd /path/to/vault
npx obsidian-project-assistant install
```

## Step 2: Quick Context Detection

### Detect Project Name

Try these methods in order:

1. **From user's message** - If user explicitly mentions project name in their request
2. **From git repository**:
   ```bash
   git rev-parse --is-inside-work-tree 2>/dev/null && basename $(git rev-parse --show-toplevel)
   ```
   Transform kebab-case → Title Case (e.g., "obsidian-project-assistant" → "Obsidian Project Assistant")

3. **From directory name**:
   ```bash
   basename $(pwd)
   ```

If none of these work or result is generic (like "src", "build", "test"), set project_name to null (will ask user later).

### Detect Project Area

Run quick file pattern checks:

```bash
# Check for Hardware indicators
if find . -maxdepth 2 -type f \( -name "*.ino" -o -name "*.cpp" -o -name "platformio.ini" \) 2>/dev/null | grep -q .; then
  echo "Hardware"
# Check for Software indicators
elif find . -maxdepth 2 -type f \( -name "package.json" -o -name "*.py" -o -name "*.js" -o -name "*.ts" \) 2>/dev/null | grep -q .; then
  echo "Software"
# Check for Woodworking indicators
elif find . -maxdepth 2 -type f \( -name "*.stl" -o -name "*.blend" -o -name "*.f3d" \) 2>/dev/null | grep -q .; then
  echo "Woodworking"
# Check for Music Synthesis indicators
elif find . -maxdepth 2 -type f \( -name "*.pd" -o -name "*.maxpat" \) 2>/dev/null | grep -q .; then
  echo "Music Synthesis"
fi
```

If no clear match, set area to null (will ask user later).

### Extract Description

Try to extract a brief description:
1. Check if README.md exists and read first paragraph
2. Check package.json for description field
3. Parse user's message for description
4. Default to empty string

## Step 3: Ask Clarifying Questions

If project_name is null OR area is null, use AskUserQuestion before launching agent:

**If project name is unclear:**
```
Question: "What would you like to name this project?"
Options:
  - [Current directory name]
  - [Git repo name if available]
  - Other (custom input)
```

**If area is unclear:**
```
Question: "What type of project is this?"
Options:
  - Hardware
  - Software
  - Woodworking
  - Music Synthesis
  - Other (custom input)
```

## Step 4: Launch Documentation Agent

Once you have all context, launch a general-purpose agent with the Task tool:

**Agent Prompt Template:**

```
You are the Obsidian Project Documentation Agent. Your task is to create or update project documentation in the user's Obsidian vault.

**Context:**
- Vault Path: {vault_path}
- Project Name: {project_name}
- Project Area: {area}
- Description: {description}
- Working Directory: {cwd}
- Current Date: {current_date}

**Configuration:**
- auto_commit: {auto_commit}
- auto_push: {auto_push}
- git_enabled: {git_enabled}

**User's Request:**
{user_original_message}

**Your Task:**

1. Determine if this is a:
   - New project note creation
   - Existing project note update
   - Experiment logging
   - Daily note update

2. Based on the user's request, create or update the appropriate note:

   **For Project Notes:**
   - Check if note exists at: {vault_path}/Projects/{project_name}.md
   - If new: Load template from ~/.claude/skills/obsidian-project-assistant/templates/project-template.md
   - Fill placeholders: {{title}}, {{date}}, {{area}}, {{description}}
   - If updating: Read existing note, preserve content, append to Progress Log section
   - Update the 'updated:' field in frontmatter to {current_date}

   **For Experiment Notes:**
   - Load template from ~/.claude/skills/obsidian-project-assistant/templates/experiment-template.md
   - Extract hypothesis, observations, conclusions from conversation
   - Create file at: {vault_path}/Projects/{current_date} - [Experiment Name].md

3. Extract progress information from the conversation or user's message
   - Summarize what was accomplished today
   - Include technical details mentioned
   - Keep it concise but informative

4. Write the note to the vault

5. Handle Git Operations (if git_enabled is true):
   - Check if vault is a git repo: cd {vault_path} && git rev-parse --git-dir
   - If auto_commit is true: Commit automatically
   - If auto_commit is false: Skip commit (user will handle manually)
   - Commit message format:
     ```
     Update {project_name} project notes

     - Added progress log entry for {current_date}
     - [Brief summary of changes]

     🤖 Generated with the help of Claude Code Obsidian Project Documentation Assistant
     ```
   - If auto_push is true AND remote exists: Push automatically
   - If auto_push is false: Skip push
   - Check for remote: git remote | grep -q 'origin'
   - Push command: git push origin HEAD

6. Return a summary:
   - Path to created/updated note
   - What was documented
   - Git operations performed (committed, pushed, or skipped)

**Important:**
- Use absolute paths for all file operations
- Preserve existing user content when updating notes
- Only append to the Progress Log section for existing projects
- Use the current date for all timestamp operations
- Handle errors gracefully (missing templates, git failures, etc.)
```

## Step 5: Report Results

When the agent completes, inform the user:

```
✅ Project documented successfully!

📝 Updated: {path_to_note}
📋 Summary: {what_was_documented}
🔄 Git: {commit_status} {push_status}
```

## Task Types

The skill supports multiple documentation tasks:

1. **"document this project"** - Create or update main project note
2. **"update my notes"** - Add progress to existing project
3. **"log this experiment"** - Create experiment note
4. **"track my progress"** - Update with today's work

The agent will automatically determine the appropriate action based on the user's request.

## Error Handling

If errors occur:
- **Config missing**: Instruct user to run installation
- **Vault not accessible**: Verify vault_path in config
- **Git operations fail**: Report error, but still create/update note
- **Template missing**: Use a basic template or ask user to reinstall

## Notes

- The agent runs in the background, making this skill token-efficient
- Context detection happens before agent launch, keeping agent focused
- User questions are asked upfront, so agent can run autonomously
- All file operations happen in the agent's isolated context
