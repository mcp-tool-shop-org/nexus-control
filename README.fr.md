<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-control/readme.png" alt="Nexus Control" width="400" />
</p>

<p align="center">
  Orchestration and approval layer for nexus-router executions.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-control/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-control/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/nexus-control"><img src="https://codecov.io/gh/mcp-tool-shop-org/nexus-control/branch/main/graph/badge.svg" alt="Codecov" /></a>
  <a href="https://pypi.org/project/nexus-control/"><img src="https://img.shields.io/pypi/v/nexus-control" alt="PyPI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-control/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---



Un plan de contrôle minimal qui transforme "le routeur peut exécuter" en "l'organisation peut décider en toute sécurité de l'exécuter" – avec une preuve cryptographique.

## Identifiant de la marque + de l'outil

| Clé | Valeur |
|-----|-------|
| Marque / dépôt | `nexus-control` |
| Paquet Python | `nexus_control` |
| Auteur | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| Licence | MIT |

## Promesse fondamentale

Chaque exécution est liée à :
- Une **décision** (la requête + la politique)
- Une **politique** (règles d'approbation, modes autorisés, contraintes)
- Une **traçabilité des approbations** (qui a approuvé, quand, avec quel commentaire)
- Un **identifiant d'exécution `run_id` du routeur nexus** (pour un audit complet de l'exécution)
- Un **paquet d'audit** (liaison cryptographique de la gouvernance à l'exécution)

Tout est exportable, vérifiable et reproductible.

> Consultez [ARCHITECTURE.md](ARCHITECTURE.md) pour comprendre le modèle conceptuel complet et les garanties de conception.

## Installation

```bash
pip install nexus-control
```

Ou à partir du code source :
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## Démarrage rapide

```python
from nexus_control import NexusControlTools
from nexus_control.events import Actor

# Initialize (uses in-memory SQLite by default)
tools = NexusControlTools(db_path="decisions.db")

# 1. Create a request
result = tools.request(
    goal="Rotate production API keys",
    actor=Actor(type="human", id="alice@example.com"),
    mode="apply",
    min_approvals=2,
    labels=["prod", "security"],
)
request_id = result.data["request_id"]

# 2. Get approvals
tools.approve(request_id, actor=Actor(type="human", id="alice@example.com"))
tools.approve(request_id, actor=Actor(type="human", id="bob@example.com"))

# 3. Execute (with your router)
result = tools.execute(
    request_id=request_id,
    adapter_id="subprocess:mcpt:key-rotation",
    actor=Actor(type="system", id="scheduler"),
    router=your_router,  # RouterProtocol implementation
)

print(f"Run ID: {result.data['run_id']}")

# 4. Export audit package (cryptographic proof of governance + execution)
audit = tools.export_audit_package(request_id)
print(audit.data["digest"])  # sha256:...
```

## Outils MCP

| Outil | Description |
|------|-------------|
| `nexus-control.request` | Créer une requête d'exécution avec un objectif, une politique et des approbateurs. |
| `nexus-control.approve` | Approuver une requête (prend en charge les approbations N-sur-M). |
| `nexus-control.execute` | Exécuter la requête approuvée via le routeur nexus. |
| `nexus-control.status` | Obtenir l'état de la requête et le statut de l'exécution associée. |
| `nexus-control.inspect` | Introspection en lecture seule avec une sortie lisible par l'homme. |
| `nexus-control.template.create` | Créer un modèle de politique nommé et immuable. |
| `nexus-control.template.get` | Récupérer un modèle par son nom. |
| `nexus-control.template.list` | Lister tous les modèles avec un filtrage optionnel par étiquette. |
| `nexus-control.export_bundle` | Exporter une décision sous forme de paquet portable et vérifié. |
| `nexus-control.import_bundle` | Importer un paquet avec gestion des conflits et validation de la reproduction. |
| `nexus-control.export_audit_package` | Exporter le paquet d'audit reliant la gouvernance à l'exécution. |

## Paquets d'audit (v0.6.0)

Un seul artefact JSON qui lie cryptographiquement :
- **Ce qui était autorisé** (paquet de contrôle)
- **Ce qui a réellement été exécuté** (exécution du routeur)
- **Pourquoi cela a été autorisé** (lien entre le contrôle et le routeur)

Dans un seul digest vérifiable `binding_digest`.

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

Deux modes de routeur :

| Mode | Description | Cas d'utilisation |
|------|-------------|----------|
| **Reference** | `run_id` + `router_digest` | CI, systèmes internes |
| **Embedded** | Paquet de routeur complet inclus | Organismes de réglementation, archivage à long terme |

## Modèles de décision (v0.3.0)

Paquets de politiques nommés et immuables qui peuvent être réutilisés dans différentes décisions :

```python
tools.template_create(
    name="prod-deploy",
    actor=Actor(type="human", id="platform-team"),
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    labels=["prod"],
)

# Use template with optional overrides
result = tools.request(
    goal="Deploy v2.1.0",
    actor=actor,
    template_name="prod-deploy",
    override_min_approvals=3,  # Stricter for this deploy
)
```

## Cycle de vie des décisions (v0.4.0)

Cycle de vie calculé avec les raisons de blocage et la chronologie :

```python
from nexus_control import compute_lifecycle

lifecycle = compute_lifecycle(decision, events, policy)

# Blocking reasons (triage-ladder ordered)
for reason in lifecycle.blocking_reasons:
    print(f"{reason.code}: {reason.message}")

# Timeline with truncation
for entry in lifecycle.timeline:
    print(f"  {entry.seq}  {entry.label}")
```

## Exportation/Importation de paquets (v0.5.0)

Paquets de décisions portables et vérifiés :

```python
# Export
bundle_result = tools.export_bundle(decision_id)
bundle_json = bundle_result.data["canonical_json"]

# Import with conflict handling
import_result = tools.import_bundle(
    bundle_json,
    conflict_mode="new_decision_id",
    replay_after_import=True,
)
```

Modes de conflit : `reject_on_conflict`, `new_decision_id`, `overwrite`

## Modèle de données

### Conception basée sur les événements

L'état est dérivé en rejouant un journal d'événements immuable :

```
decisions (header)
  └── decision_events (append-only log)
        ├── DECISION_CREATED
        ├── POLICY_ATTACHED
        ├── APPROVAL_GRANTED
        ├── APPROVAL_REVOKED
        ├── EXECUTION_REQUESTED
        ├── EXECUTION_STARTED
        ├── EXECUTION_COMPLETED
        └── EXECUTION_FAILED
```

### Modèle de politique

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### Modèle d'approbation

- Comptabilisé par `actor.id` distinct.
- Peut inclure un `comment` et une date d'expiration optionnelle (`expires_at`).
- Peut être révoqué (avant l'exécution).
- L'exécution nécessite des approbations pour satisfaire la politique **au moment de l'exécution**.

## Développement

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests (203 tests)
pytest

# Type check (strict mode)
pyright

# Lint
ruff check .
```

## Structure du projet

```
nexus-control/
├── nexus_control/
│   ├── __init__.py          # Public API + version
│   ├── tool.py              # MCP tool entrypoints (11 tools)
│   ├── store.py             # SQLite event store
│   ├── events.py            # Event type definitions
│   ├── policy.py            # Policy validation + router compilation
│   ├── decision.py          # State machine + replay
│   ├── lifecycle.py         # Blocking reasons, timeline, progress
│   ├── template.py          # Named immutable policy templates
│   ├── export.py            # Decision bundle export
│   ├── import_.py           # Bundle import with conflict modes
│   ├── bundle.py            # Bundle types + digest computation
│   ├── audit_package.py     # Audit package types + verification
│   ├── audit_export.py      # Audit package export + rendering
│   ├── canonical_json.py    # Deterministic serialization
│   └── integrity.py         # SHA-256 helpers
├── schemas/                 # JSON schemas for tool inputs
├── tests/                   # 203 tests across 9 test files
├── ARCHITECTURE.md          # Mental model + design guarantees
├── QUICKSTART.md
├── README.md
└── pyproject.toml
```

## Sécurité et portée des données

- **Données traitées :** politiques d'approbation en mémoire, journaux d'audit d'exécution (intégrité SHA-256), métadonnées des appels d'outils. Toutes les données sont éphémères, sauf si elles sont explicitement exportées.
- **Données NON traitées :** aucune requête réseau en dehors de la communication avec le routeur nexus, aucune écriture sur le système de fichiers (les exports d'audit sont envoyés aux chemins spécifiés par l'appelant), aucune identité de l'OS, aucune télémétrie.
- **Autorisations requises :** aucune autre que les autorisations du processus Python.

Consultez [SECURITY.md](SECURITY.md) pour signaler les vulnérabilités.

## Tableau de bord

| Catégorie | Score |
|----------|-------|
| A. Sécurité | 10/10 |
| B. Gestion des erreurs | 10/10 |
| C. Documentation pour les opérateurs | 10/10 |
| D. Hygiène de l'expédition | 10/10 |
| E. Identité (logiciel) | 10/10 |
| **Overall** | **50/50** |

> Évalué avec [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck)

## Licence

Licence MIT — voir [LICENSE](LICENSE) pour plus de détails.

---

Développé par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
