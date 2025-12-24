# Contributing to Obsidian Project Assistant

Thank you for your interest in contributing! This guide will help you get started.

## Ways to Contribute

- 🐛 **Report bugs** - Found an issue? Let us know!
- 💡 **Suggest features** - Have an idea? Share it!
- 📝 **Improve documentation** - Help others understand the project
- 🔧 **Submit code** - Fix bugs or add features
- 🎨 **Create templates** - Share templates for new project areas
- 🌍 **Translate** - Help make this accessible to more people

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/yourusername/obsidian-project-assistant.git
cd obsidian-project-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Test Locally

Install the skill locally for testing:

```bash
# Create a test vault
mkdir ~/test-vault
node scripts/install.js init ~/test-vault

# Or install to existing vault
cd ~/your-vault
node scripts/install.js install
```

### 4. Make Changes

- Create a branch: `git checkout -b feature/your-feature-name`
- Make your changes
- Test thoroughly
- Commit with clear messages

### 5. Submit Pull Request

- Push your branch to GitHub
- Open a pull request with a clear description
- Link any related issues

## Development Guidelines

### Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code patterns
- Keep functions focused and small

### File Organization

```
obsidian-project-assistant/
├── skills/                      # Skill implementation
│   └── obsidian-project-assistant/
│       ├── SKILL.md            # Main skill logic
│       ├── templates/          # Note templates
│       └── helpers/            # Detection rules
├── scripts/                     # Installation scripts
├── test/                        # Tests
└── docs/                        # Documentation (future)
```

### Testing

Run tests before submitting:

```bash
npm test
```

**Test checklist:**

- [ ] New vault creation works
- [ ] Existing vault installation works
- [ ] Context detection works for your changes
- [ ] Templates render correctly
- [ ] No errors in console

### Commit Messages

Use clear, descriptive commit messages:

```text
Good:
- "Add support for Rust project detection"
- "Fix template placeholder replacement"
- "Improve area classification for CAD files"

Avoid:
- "Fix bug"
- "Update files"
- "Changes"
```

## Adding New Features

### Adding a New Project Area

1. **Update area-mapping.md:**
   Add file extensions and keywords for the new area

2. **Update context-detection.md:**
   Add detection logic for the area

3. **Update config.json:**
   Add the area to default configuration

4. **Create template (optional):**
   If the area needs a specialized template

5. **Test:**
   Create a test fixture project and verify detection

**Example: Adding "Robotics" area**

```bash
# 1. Update helpers/area-mapping.md
# Add: .ros, .urdf files → Robotics

# 2. Update helpers/context-detection.md
# Add detection command for robotics files

# 3. Test with a sample ROS project
mkdir test/fixtures/ros-project
# Add sample files
# Run tests
```

### Adding New Templates

1. Create template in `skills/obsidian-project-assistant/templates/`
2. Use `{{placeholder}}` syntax for variables
3. Update SKILL.md with template usage instructions
4. Add to bootstrap.js installation logic
5. Document in README.md

### Improving Context Detection

The skill uses file patterns to detect project types. To improve detection:

1. **Identify false positives/negatives:**
   - Which projects are misclassified?
   - What files indicate the correct classification?

2. **Update detection rules:**
   - Add file extensions to `helpers/area-mapping.md`
   - Add detection commands to `helpers/context-detection.md`
   - Update SKILL.md if logic changes

3. **Add test fixtures:**
   - Create example project in `test/fixtures/`
   - Add test case in `test/bootstrap.test.js`

4. **Document:**
   - Update README with new detection capabilities

## Testing Guidelines

### Manual Testing

**Test Scenario 1: New Vault**

```bash
# Create test vault
node scripts/install.js init ~/test-vault-1

# Verify:
- Directories created
- Templates copied
- Skill installed to ~/.claude/skills/
- config.json created
```

**Test Scenario 2: Existing Vault**

```bash
# Create mock vault
mkdir ~/test-vault-2/.obsidian

# Install
cd ~/test-vault-2
node scripts/install.js install

# Verify:
- No data loss
- Missing directories added
- Skill installed
```

**Test Scenario 3: Context Detection**

```bash
# Create test projects
mkdir ~/test-projects/my-arduino-project
# Add .ino file

# Use skill in Claude Code
cd ~/test-projects/my-arduino-project
claude
# Say: "document this project"

# Verify:
- Detects as Hardware
- Creates note in vault
- Correct project name
```

### Automated Testing

Add tests to `test/bootstrap.test.js`:

```javascript
test('Should detect Python projects as Software', () => {
  // Your test here
});
```

Run with:

```bash
npm test
```

## Documentation

### README Updates

When adding features, update README.md:

- Add to Features section
- Add usage example
- Update configuration section if needed

### SKILL.md Updates

The SKILL.md file is the instruction manual for Claude. Update it when:

- Adding new capabilities
- Changing behavior
- Adding new templates
- Modifying context detection

Keep instructions:

- Clear and specific
- With concrete examples
- Focused on what Claude should do

## Release Process

Maintainers will:

1. Review and merge pull requests
2. Update version in package.json
3. Update CHANGELOG.md
4. Create GitHub release
5. Publish to NPM

## Community Guidelines

- **Be respectful** - We're all learning
- **Be constructive** - Focus on solutions
- **Be patient** - Reviews take time
- **Be helpful** - Share knowledge

## Questions?

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and ideas
- **Pull Request Comments** - For code-specific questions

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes for significant contributions
- README acknowledgments (for major features)

Thank you for contributing to make project documentation easier for everyone!

---

**Happy coding!** 🚀
