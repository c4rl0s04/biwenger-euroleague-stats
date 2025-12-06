# Contributing to BiwengerStats

First off, thank you for considering contributing! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

Be respectful and constructive. We're all here to learn and improve.

## How Can I Contribute?

### 🐛 Reporting Bugs

1. Check if the bug already exists in [Issues](https://github.com/c4rl0s04/biwengerstats-next/issues)
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### 💡 Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Be open to discussion

### 🔧 Code Contributions

1. Look for issues labeled `good first issue` or `help wanted`
2. Comment on the issue to claim it
3. Fork and create a branch
4. Make your changes
5. Submit a PR

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/biwengerstats-next.git
cd biwengerstats-next

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Run tests
npm test

# Start dev server
npm run dev
```

## Pull Request Process

1. **Branch naming**: `feature/description` or `fix/description`
2. **Commits**: Use clear, descriptive messages
3. **Tests**: Add tests for new features
4. **Documentation**: Update README if needed
5. **Review**: Wait for maintainer review

## Style Guide

### JavaScript/React

- Use functional components with hooks
- Use `'use client'` directive for client components
- Destructure props
- Use meaningful variable names

### CSS

- Use Tailwind CSS utilities
- Follow existing color schemes (slate, blue accents)
- Mobile-first responsive design

### Commits

```
feat: add player comparison feature
fix: resolve standings calculation bug
docs: update installation instructions
style: format code with prettier
refactor: simplify database queries
test: add unit tests for sync module
```

---

Thank you for contributing! 🏀
