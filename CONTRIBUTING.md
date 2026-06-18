# Contributing to NullCarbon

Thank you for your interest in contributing to NullCarbon! We welcome contributions from everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Convention](#commit-convention)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project is governed by the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its terms.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/nullcarbon.git
   cd nullcarbon
   ```
3. Install dependencies and set up the development environment:
   ```bash
   ./scripts/setup.sh
   ```
4. Create a branch for your work:
   ```bash
   git checkout -b feat/my-feature
   ```

## Development Workflow

### Prerequisites

See [README.md](README.md#prerequisites) for required tooling (Node.js 20+, Rust, Stellar CLI, Noir, Barretenberg, PostgreSQL).

### Setup

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Fill in your environment variables
```

### Running Locally

| Layer | Command |
|---|---|
| Circuits (Noir) | `cd circuits && nargo compile && nargo test` |
| Contracts (Soroban) | `cd contracts && cargo build --release && cargo test` |
| Backend (NestJS) | `cd backend && npm run start:dev` |
| Frontend (Angular) | `cd frontend && ng serve` |
| Indexer | `cd indexer && npm run start` |
| Full E2E | `./scripts/test-e2e.sh` |

### One-time Contract Deployment

```bash
cd contracts && ./scripts/deploy.sh
```

## Project Structure

```
nullcarbon/
├── circuits/          # Noir ZK circuits (retirement, compliance, vintage)
├── contracts/         # Soroban smart contracts (Rust)
├── backend/           # NestJS API (registry bridge, proof relay)
├── frontend/          # Angular web app (retirement flow, audit portal)
├── indexer/           # Soroban event indexer
└── scripts/           # Deployment, testing, registry sync
```

## Coding Standards

### Rust (Soroban Contracts)
- Format with `rustfmt` (`cargo fmt`)
- Follow [Soroban contract conventions](https://soroban.stellar.org/docs)
- Use `#![no_std]` for contracts
- Document public functions with doc comments

### TypeScript / Angular
- Format with [Prettier](https://prettier.io/)
- Lint with ESLint (`npm run lint`)
- Use Angular standalone components
- Follow the existing service/component pattern in `frontend/src/app/`

### Noir (ZK Circuits)
- Follow existing circuit patterns in `circuits/src/`
- Name public inputs with `pub` prefix
- Add `#[test]` annotations for circuit tests
- Keep constraints low where possible

## Testing

All code must be tested before submission.

```bash
# Run all tests
cd circuits && nargo test && cd ..
cd contracts && cargo test && cd ..
cd backend && npm test && cd ..
cd frontend && ng test && cd ..

# End-to-end
./scripts/test-e2e.sh
```

When adding new features, include:
- Unit tests for circuits (Noir `#[test]`)
- Unit/integration tests for contracts (Rust `#[test]`)
- Service tests for backend (Jest)
- Component tests for frontend (Jasmine/Karma)

## Pull Request Guidelines

1. **Keep PRs focused** — one feature or fix per PR. Split large changes.
2. **Open an issue first** for significant changes to discuss design before coding.
3. **Write descriptive titles** using the [commit convention](#commit-convention).
4. **Link related issues** in the PR description (e.g., `Closes #12`).
5. **Ensure CI passes** — all lint, test, and build jobs must be green.
6. **Update documentation** if changing public APIs or adding features.
7. **Self-review your diff** before requesting a review.

### PR Checklist

Before submitting, verify:
- [ ] Code follows project coding standards
- [ ] Tests added/updated and passing
- [ ] Documentation updated (README, inline docs, API docs)
- [ ] No new warnings or lint errors
- [ ] Commit messages follow the convention
- [ ] Branch is up to date with `main`
- [ ] Changes are backward-compatible (or documented breaking changes)

### Review Process

1. Maintainer reviews within 2–3 business days
2. Address review feedback with additional commits
3. Once approved, a maintainer will squash-merge your PR

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`

**Examples:**
```
feat(circuits): add vintage range constraint to retirement proof
fix(contracts): prevent nullifier registry re-initialization
docs: update API reference with new compliance endpoint
test(backend): add integration test for merkle proof route
```

## Issue Reporting

### Bug Reports
Open a [Bug Report](https://github.com/your-org/nullcarbon/issues/new?template=bug_report.md) with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, tool versions, network)
- Logs or screenshots if applicable

### Feature Requests
Open a [Feature Request](https://github.com/your-org/nullcarbon/issues/new?template=feature_request.md) describing the problem, proposed solution, and any alternatives considered.

## Need Help?

- Check the [README](README.md) for detailed documentation
- Open a [Discussion](https://github.com/your-org/nullcarbon/discussions)
- Tag `@NnamdiCyber` in issues for maintainer attention
