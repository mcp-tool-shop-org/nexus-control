.PHONY: verify test lint typecheck build

verify: lint typecheck test
	@echo "✓ All checks passed"

test:
	pytest tests/ -v --cov=nexus_control --cov-report=term-missing

lint:
	ruff check nexus_control tests

typecheck:
	pyright nexus_control

build:
	python -m build --sdist --wheel
