<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-control/readme.png" alt="Nexus Control" width="400" />
</p>

<p align="center">
  Orchestration and approval layer for nexus-router executions.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-control/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-control/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/nexus-control/"><img src="https://img.shields.io/pypi/v/nexus-control" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/nexus-control/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/nexus-control" alt="License: MIT" /></a>
  <a href="https://pypi.org/project/nexus-control/"><img src="https://img.shields.io/pypi/pyversions/nexus-control" alt="Python versions" /></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-control/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---



Un livello di controllo sottile che trasforma "il router può eseguire" in "l'organizzazione può decidere in sicurezza di eseguire" – con una prova crittografica.

## ID del marchio + ID dello strumento

| Chiave | Valore |
| ----- | ------- |
| Marchio / repository | `nexus-control` |
| Pacchetto Python | `nexus_control` |
| Autore | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| Licenza | MIT |

## Promessa fondamentale

Ogni esecuzione è collegata a:
- Una **decisione** (la richiesta + la policy)
- Una **policy** (regole di approvazione, modalità consentite, vincoli)
- Una **traccia di approvazione** (chi ha approvato, quando, con quale commento)
- Un **ID di esecuzione di nexus-router** (per l'audit completo dell'esecuzione)
- Un **pacchetto di audit** (associazione crittografica tra governance ed esecuzione)

Tutto è esportabile, verificabile e riproducibile.

> Consultare [ARCHITECTURE.md](ARCHITECTURE.md) per il modello concettuale completo e le garanzie di progettazione.

## Installazione

```bash
pip install nexus-control
```

Oppure dal codice sorgente:
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## Guida rapida

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

## Strumenti MCP

| Strumento | Descrizione |
| ------ | ------------- |
| `nexus-control.request` | Crea una richiesta di esecuzione con obiettivo, policy e approvatori |
| `nexus-control.approve` | Approva una richiesta (supporta le approvazioni N-of-M) |
| `nexus-control.execute` | Esegui la richiesta approvata tramite nexus-router |
| `nexus-control.status` | Ottieni lo stato della richiesta e lo stato dell'esecuzione collegata |
| `nexus-control.inspect` | Introspezione in sola lettura con output leggibile |
| `nexus-control.template.create` | Crea un modello di policy denominato e immutabile |
| `nexus-control.template.get` | Recupera un modello per nome |
| `nexus-control.template.list` | Elenca tutti i modelli con filtraggio opzionale per etichetta |
| `nexus-control.export_bundle` | Esporta una decisione come un pacchetto portatile con verifica dell'integrità |
| `nexus-control.import_bundle` | Importa un pacchetto con modalità di conflitto e convalida della riproduzione |
| `nexus-control.export_audit_package` | Esporta il pacchetto di audit che associa la governance all'esecuzione |

## Pacchetti di audit (v0.6.0)

Un singolo artefatto JSON che associa crittograficamente:
- **Cosa era consentito** (pacchetto di controllo)
- **Cosa è stato effettivamente eseguito** (esecuzione del router)
- **Perché era consentito** (collegamento tra controllo e router)

In un unico `binding_digest` verificabile.

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

Due modalità del router:

| Modalità | Descrizione | Caso d'uso |
| ------ | ------------- | ---------- |
| **Reference** | `run_id` + `router_digest` | CI, sistemi interni |
| **Embedded** | Pacchetto completo del router incluso | Regolatori, archiviazione a lungo termine |

## Modelli di decisione (v0.3.0)

Pacchetti di policy denominati e immutabili che possono essere riutilizzati in diverse decisioni:

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

## Ciclo di vita delle decisioni (v0.4.0)

Ciclo di vita calcolato con motivi di blocco e timeline:

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

## Esportazione/Importazione di pacchetti (v0.5.0)

Pacchetti di decisione portabili con verifica dell'integrità:

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

Modalità di conflitto: `reject_on_conflict`, `new_decision_id`, `overwrite`

## Modello dei dati

### Progettazione basata su eventi

Tutto lo stato è derivato dalla riproduzione di un registro di eventi immutabile:

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

### Modello delle policy

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### Modello delle approvazioni

- Contato per `actor.id` distinti
- Può includere `comment` e `expires_at` opzionale
- Può essere revocato (prima dell'esecuzione)
- L'esecuzione richiede approvazioni per soddisfare la policy **al momento dell'esecuzione**

## Sviluppo

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

## Struttura del progetto

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

## Licenza

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
