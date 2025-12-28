# Obsidian Project Documentation Assistant

A Claude Code skill that automatically documents your technical projects in Obsidian as you work.

## What is it?

As you work on projects with Claude Code, this skill captures your progress, experiments, and insights into a structured Obsidian vault. No more forgetting what you tried, why you made certain decisions, or what worked and what didn't.

Perfect for makers, engineers, and tinkerers who work across multiple technical domains.

## Features

- 🤖 **Auto-documents projects** - Captures progress as you work with Claude Code
- 📁 **Organized by area** - Classifies projects including Hardware, Software, Woodworking, or Music Synthesis
- 🔬 **Experiment logging** - Records experiments with hypothesis, observations, and conclusions
- 🔗 **Smart linking** - Automatically links related notes and projects
- 📝 **Template-based** - Uses consistent, customizable templates
- 🎯 **Context-aware** - Infers project details from your working directory
- 🔄 **Git integration** - Optionally commits and pushes changes to your vault repository
- 🚀 **Auto-backup** - Automatically push to remote GitHub repo for seamless backup
- 🌍 **Cross-project** - Works from any directory, updates central vault

## Installation

> **Note:** This package is not yet published to npm. Use the GitHub installation method below until it's available on npm.

### New Vault

Create a new Obsidian vault with the recommended structure:

```bash
# Install directly from GitHub
npx github:ali5ter/obsidian-project-assistant init ~/Documents/MyVault
```

**Or clone and run locally:**

```bash
git clone https://github.com/ali5ter/obsidian-project-assistant.git
cd obsidian-project-assistant
node scripts/install.js init ~/Documents/MyVault
```

This will:

- Create the vault folder structure
- Install note templates
- Set up the Claude Code skill
- Optionally initialize a git repository

### Existing Vault

Add to an existing Obsidian vault:

```bash
# Install directly from GitHub
cd ~/Documents/ExistingVault
npx github:ali5ter/obsidian-project-assistant install
```

**Or clone and run locally:**

```bash
git clone https://github.com/ali5ter/obsidian-project-assistant.git
cd obsidian-project-assistant
node scripts/install.js install
```

This will:

- Create a backup of affected files
- Add missing folders and templates
- Install the skill
- Preserve all existing content

### Once Published to npm

After publication, the simpler command will work:

```bash
npx obsidian-project-assistant init ~/Documents/MyVault
# or
npx obsidian-project-assistant install
```

## Usage

Just work on your project with Claude Code and mention documentation:

```bash
cd ~/projects/arduino-temperature-sensor
claude
```

Then in conversation:

```text
User: "I'm building an Arduino temperature sensor. Let's document this project."
```

The skill will:

1. Detect it's a hardware project (from `.ino` files)
2. Extract the project name ("Arduino Temperature Sensor")
3. Create a project note in your vault
4. Track your progress as you work

### Other Commands

**Update existing project:**

```text
"I just got the I2C communication working. Update my project notes."
```

**Log an experiment:**

```text
"Log this experiment - I tested three different capacitor values for filtering."
```

**Ask about the vault:**

```text
"Show me my recent projects"
"What's in my Hardware area?"
```

## How It Works

The skill uses an efficient, non-blocking architecture that works in the background. When you invoke it, the skill quickly detects your project context, asks any needed questions upfront, then handles the documentation work asynchronously. This means you can keep working while your notes are being updated and synced.

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

```text
ObsidianVault/
├── Projects/              # Individual project notes
├── Areas/
│   ├── Hardware/
│   ├── Software/
│   ├── Woodworking/
│   └── Music Synthesis/
├── Resources/             # Reference materials
├── Templates/             # Note templates
├── Daily/                 # Daily work logs
└── Archive/               # Completed projects
```

### Note Templates

**Project Notes** include:

- Overview and goals
- Resources and materials
- Progress log with timestamps
- Observations and outcomes
- Links to related projects

**Experiment Notes** include:

- Hypothesis and goals
- Setup and procedure
- Observations and data
- Analysis and conclusions
- Link to parent project

## Configuration

The skill is configured in `~/.claude/skills/obsidian-project-assistant/config.json`:

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

- **Node.js** >= 16.0.0 (for installation)
- **Claude Code** - The official Claude CLI
- **Obsidian** (optional, for viewing notes)
- **Git** (optional, for version control)

## Examples

### Hardware Project

```bash
cd ~/projects/esp32-weather-station
claude
```

```text
User: "I'm building a weather station with ESP32. Document this project."

Claude: [Detects Hardware project, creates note at Projects/ESP32 Weather Station.md]
```

### Software Project

```bash
cd ~/code/rest-api
claude
```

```text
User: "This is a REST API for user management. Let's track this."

Claude: [Detects Software project from package.json, creates project note]
```

### Experiment Logging

```text
User: "I tested the DHT22 sensor at different sampling rates. Log this experiment."

Claude: [Creates experiment note with observations, links to parent project]
```

## Customization

### Custom Areas

Edit `~/.claude/skills/obsidian-project-assistant/config.json`:

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

### Custom Templates

Templates are in your vault's `Templates/` folder. Edit them to match your workflow:

- `Project Template.md`
- `Experiment Template.md`
- `Daily Note Template.md`

## Troubleshooting

**Skill not activating:**

- Check that `~/.claude/skills/obsidian-project-assistant/` exists
- Verify config.json has correct vault_path
- Restart Claude Code

**Wrong area detected:**

- Specify area in conversation: "This is a hardware project"
- Update config.json with project directory mappings

**Git commits failing:**

- Ensure git is installed and vault is a git repo
- Set `git_enabled: false` to disable git integration

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ideas for contributions:**

- New project area templates
- Improved context detection
- Additional file pattern mappings
- Translations
- Bug fixes

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Created by [Alister Lewis-Bowen](https://github.com/alisterlewis)

Built with [Claude Code](https://code.claude.com) - the official Claude CLI.

## Links

- **GitHub**: https://github.com/yourusername/obsidian-project-assistant
- **Issues**: https://github.com/yourusername/obsidian-project-assistant/issues
- **Claude Code**: https://code.claude.com
- **Obsidian**: https://obsidian.md

---

**Made with ❤️ for makers, tinkerers, and technical explorers**