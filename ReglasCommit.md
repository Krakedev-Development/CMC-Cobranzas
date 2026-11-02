# Git Commit and Branch Standard Guidelines

This document defines the mandatory format for commit messages and branch names in this repository. Compliance is required for Pull Request approval.

## 1. Mandatory Commit Message Format
<type>(<scope>): <short description>
[optional body]
[optional footer(s)]

- **type**: Category of change (must be one of the allowed types below).
- **scope**: Affected module or area (e.g., auth, api, ui, domain). Optional but recommended.
- **short description**: Concise summary of the change, written in English.
- **body**: Detailed explanation when required.
- **footer**: Issue references and breaking change notices.

## 2. Allowed Commit Types
- `feat`: New feature or capability.
- `fix`: Bug fix.
- `docs`: Documentation updates only.
- `style`: Changes that do not affect code logic (formatting, spaces, prettier).
- `refactor`: Code improvements that neither fix a bug nor add a feature.
- `perf`: Performance optimizations.
- `test`: Adding or updating tests.
- `build`: Changes to build system or external dependencies.
- `chore`: Maintenance tasks, repo updates.
- `ci`: CI/CD or pipeline changes.

## 3. Forbidden Commits
Generic messages like `update files`, `fix stuff`, `changes`, `arreglos varios`, or `bugfix` are strictly prohibited and will be rejected.

## 4. Branch Naming Convention
All branches must follow this format:
<type>/<short-description>-<issue-id>

Allowed branch prefixes: `feature/`, `fix/`, `hotfix/`, `chore/`, `refactor/`, `release/`, `docs/`.

## 5. Strict Rules
- Absolutely NO emojis in commit messages or branch names.
- All commit titles and descriptions must be written in English.
- Do not mix different types in a single commit.