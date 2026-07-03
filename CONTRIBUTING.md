# Contributing to Heatmap Tracker

First off, thank you for considering contributing to Heatmap Tracker! Your input is valuable and helps improve the project for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
- [Style Guides](#style-guides)
  - [Commit Messages](#commit-messages)
- [Additional Resources](#additional-resources)

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand the standards we expect from our community.

## How Can I Contribute?

### Reporting Bugs

If you encounter a bug, please report it by [opening an issue](https://github.com/mokkiebear/heatmap-tracker/issues/new). Include detailed information to help us understand and reproduce the problem:

- **Summary**: Concisely describe the issue.
- **Steps to Reproduce**: List the steps that lead to the problem.
- **Expected Behavior**: Describe what you expected to happen.
- **Actual Behavior**: Explain what actually happened.
- **Screenshots**: Attach any relevant images.
- **Environment**: Specify your operating system, Obsidian version, and plugin version.

### Suggesting Enhancements

We welcome suggestions for new features or improvements. To propose an enhancement, [open a new issue](https://github.com/mokkiebear/heatmap-tracker/issues/new) and provide:

- **Use Case**: Explain the problem your suggestion addresses.
- **Proposal**: Describe the suggested enhancement.
- **Alternatives**: Mention any alternative solutions you've considered.
- **Additional Context**: Include any other relevant information or screenshots.

### Submitting Pull Requests

We appreciate your contributions! To submit a pull request:

1. **Fork the Repository**: Click the "Fork" button at the top right of the repository page.
2. **Clone Your Fork**: Clone your forked repository to your local machine.
   ```bash
   git clone https://github.com/your-username/heatmap-tracker.git
   ```
3.	**Create a Branch**: Create a new branch for your feature or bugfix.
   ```bash
  	git checkout -b feature/your-feature-name
```
4.	**Make Changes**: Implement your changes, ensuring adherence to the project’s coding standards. If the change is user-facing, add a bullet under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) (see [RELEASING.md](RELEASING.md)).
5.	**Commit Changes**: Commit your changes with a descriptive commit message.
```bash
git commit -m "Add feature: your feature description"
```
6.	**Push to GitHub**: Push your changes to your forked repository.
```bash
git push origin feature/your-feature-name
```
7.	**Open a Pull Request**: Navigate to the original repository and open a pull request.

## Development Setup

To set up a development environment:
1. **Install Dependencies**: Run `npm install` to install the required dependencies.
2. **Start Development Server**: Use `npm run dev` to start the development server. This will automatically transpile TypeScript to JavaScript and copy the generated files to the example vault.
3. **Enable Hot-Reload**: Ensure the hot-reload plugin is installed in the example vault to reload Obsidian automatically upon code changes.

For more detailed instructions, refer to the README.md.

## Style Guides

### Commit Messages
- **Format**: Use the present tense (“Add feature” not “Added feature”).
- **Structure**: Begin with a short summary, followed by a detailed description if necessary.
- **Issue References**: Reference relevant issues by number (e.g., #123).

## Additional Resources
- **Roadmap**: Check out the ROADMAP.md to see what’s planned for the future.
- **Releasing**: See [RELEASING.md](RELEASING.md) for how versions are published, and add a `CHANGELOG.md` entry under `[Unreleased]` for any user-facing change in your PR.
- **License**: This project is licensed under the Apache-2.0 License.

Thank you for contributing to Heatmap Tracker!
