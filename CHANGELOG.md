# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-02-27

### Added
- SECURITY.md with data scope and response timeline
- SHIP_GATE.md and SCORECARD.md (Shipcheck audit — 50/50)
- CI workflow with lint, typecheck, coverage, Codecov, dep-audit
- Makefile with `verify` target
- Security & Data Scope section + scorecard in README
- Codecov badge in README
- pip-audit and pytest-cov in dev deps

### Changed
- Promoted to v1.0.0 stable release (from 0.6.1)

## [0.6.1] - 2026-02-25

### Added
- Landing page using @mcptoolshop/site-theme
- Translations (7 languages)
- 632 tests across 9 test files

## [0.6.0] - 2026-02-24

### Added
- Orchestration engine with approval policies
- Execution audit logs with SHA-256 integrity
- Deterministic canonical JSON serialization
- XRPL transaction support
- ARCHITECTURE.md and QUICKSTART.md
