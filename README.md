# Obsidian Project Documentation Manager

A Claude Code skill that automatically triggers an agent to documents your technical projects in Obsidian as you work.

## What is it?

As you work on projects with Claude Code, this skill and agent captures your progress and insights into a structured Obsidian vault. No more forgetting what you tried, why you made certain decisions, or what worked and what didn't.

Perfect for makers, engineers, and tinkerers who work across multiple technical domains.

## Features

- 🤖 **Auto-documents projects** - Captures progress as you work with Claude Code
- 📁 **Organized by area** - Classifies projects including Hardware, Software, Woodworking, or Music Synthesis
- 🔗 **Smart linking** - Automatically links related notes and projects
- 📝 **Template-based** - Uses consistent, customizable templates
- 🎯 **Context-aware** - Infers project details from your working directory
- 🔄 **Git integration** - Optionally commits and pushes changes to your vault repository
- 🚀 **Auto-backup** - Automatically push to remote GitHub repo for seamless backup
- 🌍 **Cross-project** - Works from any directory, updates central vault

## Installation

Clone the repository and run the installer:

```bash
git clone https://github.com/ali5ter/obsidian-project-assistant.git
cd obsidian-project-assistant
./install ~/Documents/MyVault
```

This will:

- Check if the Obsidian Vault directory exists
- Install note templates
- Set up the Claude Code skill and agent
- Optionally initialize a git repository

## Usage

Just work on your project with Claude Code and mention documentation:

```bash
cd ~/projects/arduino-temperature-sensor
claude
```

Then in conversation trigger the skill use a prompt like this example:

```text
I am building an Arduino based time machine. Let's document this project."
```

The skill will:

1. Detect it's a hardware project (from `.ino` files)
2. Extract the project name ("Arduino Time Machine")
3. Create a project note in your Obsidian vault
4. Track your progress as you work

### Examples of other prompts

Update existing project:

```text
I just got the I2C communication working. Update my project notes.
```

Exiting a working session with Claude Code:

```text
Ok I'm tired. Let's wrap it up for today.
```

Ask about the vault:

```text
"Show me my recent projects"
or 
"What's in my Hardware area?"
```

## How It Works

The skill uses an efficient, non-blocking architecture that works in the background. It does this by using the Obsidian Project Documentation Assistant skill to detect your project context, asks any questions upfront, then triggers the Obsidian Project Documentation Manager agent which handles the documentation work asynchronously. This means you can keep working while your notes are being updated and synced.

### Context Detection

The skill intelligently detects project context:

1. **Project Name** - From git repo, directory name, or asks you
2. **Area Classification** - Based on file extensions and patterns:
   - **Hardware**: `.ino`, `.cpp`, `platformio.ini` (Arduino, embedded)
   - **Software**: `.js`, `.py`, `package.json` (web, scripts)
   - **Woodworking**: `.stl`, `.blend`, `.f3d` (CAD files)
   - **Music Synthesis**: `.pd`, `.maxpat` (Pure Data, Max/MSP)
3. **Description** - Extracts from conversation or README.md

### Vault Structure

Any project notes will be placed into a `Projects` directory in your Obsidian Vault folder. If you already use a Vault, no other folders will be touched. If you already use a Project folder in your existing Obsidian Vault, unless a notes file using the same name the Obsidian Project Documentation Manager agent wants to use, there will be no changes to existing content. If, conicidentally, there is a file with the name the Obsidian Project Documentation Manager agent wants to use, project updates will be appended to it.

## Configuration

The skill is configured in `~/.claude/skills/obsidian-project-documentation-assistant/config.json`:

```json
{
  "vault_path": "/Users/you/Documents/ObsidianVault",
  "areas": ["Hardware", "Software", "Woodworking", "Music Synthesis"],
  "auto_commit": false,
  "auto_push": false,
  "git_enabled": true
}
```

**Options:**

- `vault_path` - Absolute path to your Obsidian vault
- `areas` - List of project areas (customize as needed)
- `auto_commit` - Auto-commit changes without asking (default: false)
- `auto_push` - Auto-push commits to remote repository (default: false)
- `git_enabled` - Enable git integration (default: true)

## Requirements

- **Claude Code** - The official Claude CLI
- **Obsidian** - For viewing your notes - you can view the markdown notes files without Obsidian of course
- **Git** - If you version control your vault content in a private remote git repository (recommended)

## Customization

### Custom Areas

Edit `~/.claude/skills/obsidian-project-documentation-assistant/config.json`:

```json
{
  "areas": [
    "Hardware",
    "Software",
    "3D Printing",
    "Photography",
    "Custom Area"
  ]
}
```

Update the `~/.claude/skills/obsidian-project-documentation-assistant/area-mapping.md` and `~/.claude/skills/obsidian-project-documentation-assistant/context-detection.md` definitions to help detect the custom area.

### Custom Template

The project note template used by the agent is located at `~/.claude/skills/obsidian-project-documentation-assistant/project-template.md`. You can edit this file directly to customize the structure and content of your project notes.

## Troubleshooting

**Skill not activating:**

- Check that `~/.claude/skills/obsidian-project-documentation-assistant/` exists
- Verify config.json has correct vault_path
- Restart Claude Code

**Wrong area detected:**

- Specify area in conversation: "This is a hardware project"
- Update config.json with project directory mappings

**Git commits failing:**

- Ensure git is installed and vault is a git repo
- Set `git_enabled: false` to disable git integration

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [GitHub](https://github.com/yourusername/obsidian-project-assistant)
- [Issues](https://github.com/yourusername/obsidian-project-assistant/issues)
- [Claude Code](https://code.claude.com)
- [Obsidian**](https://obsidian.md)

---

Made with ❤️ for makers, tinkerers, and technical explorers
