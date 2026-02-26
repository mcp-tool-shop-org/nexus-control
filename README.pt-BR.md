<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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



Um plano de controle fino que transforma "o roteador pode executar" em "a organização pode decidir com segurança executar" — com prova criptográfica.

## Identificador da Marca + da Ferramenta

| Chave | Valor |
| ----- | ------- |
| Marca / repositório | `nexus-control` |
| Pacote Python | `nexus_control` |
| Autor | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| Licença | MIT |

## Promessa Fundamental

Cada execução está vinculada a:
- Uma **decisão** (o pedido + a política)
- Uma **política** (regras de aprovação, modos permitidos, restrições)
- Um **registro de aprovações** (quem aprovou, quando, com qual comentário)
- Um **ID de execução do nexus-router** (para auditoria completa da execução)
- Um **pacote de auditoria** (vinculação criptográfica da governança à execução)

Tudo é exportável, verificável e reproduzível.

> Consulte [ARCHITECTURE.md](ARCHITECTURE.md) para obter o modelo mental completo e as garantias de design.

## Instalação

```bash
pip install nexus-control
```

Ou a partir do código-fonte:
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## Início Rápido

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

## Ferramentas MCP

| Ferramenta | Descrição |
| ------ | ------------- |
| `nexus-control.request` | Crie um pedido de execução com objetivo, política e aprovadores. |
| `nexus-control.approve` | Aprove um pedido (suporta aprovações N-de-M). |
| `nexus-control.execute` | Execute o pedido aprovado via nexus-router. |
| `nexus-control.status` | Obtenha o status do pedido e o status da execução vinculada. |
| `nexus-control.inspect` | Inspeção somente leitura com saída legível por humanos. |
| `nexus-control.template.create` | Crie um modelo de política nomeado e imutável. |
| `nexus-control.template.get` | Recupere um modelo por nome. |
| `nexus-control.template.list` | Liste todos os modelos com filtragem opcional por etiqueta. |
| `nexus-control.export_bundle` | Exporte uma decisão como um pacote portátil e com integridade verificada. |
| `nexus-control.import_bundle` | Importe um pacote com modos de conflito e validação de reprodução. |
| `nexus-control.export_audit_package` | Exporte o pacote de auditoria, vinculando a governança à execução. |

## Pacotes de Auditoria (v0.6.0)

Um único artefato JSON que vincula criptograficamente:
- **O que foi permitido** (pacote de controle)
- **O que realmente foi executado** (execução do roteador)
- **Por que foi permitido** (link entre o controle e o roteador)

Em um único "binding_digest" verificável.

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

Dois modos de roteador:

| Modo | Descrição | Caso de Uso |
| ------ | ------------- | ---------- |
| **Reference** | `run_id` + `router_digest` | CI, sistemas internos |
| **Embedded** | Pacote completo do roteador incluído | Reguladores, arquivamento de longo prazo |

## Modelos de Decisão (v0.3.0)

Pacotes de política nomeados e imutáveis que podem ser reutilizados em várias decisões:

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

## Ciclo de Vida da Decisão (v0.4.0)

Ciclo de vida calculado com motivos de bloqueio e cronograma:

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

## Exportar/Importar Pacotes (v0.5.0)

Pacotes de decisão portáteis e com integridade verificada:

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

Modos de conflito: `reject_on_conflict`, `new_decision_id`, `overwrite`

## Modelo de Dados

### Design Orientado a Eventos

Todo o estado é derivado da reprodução de um registro de eventos imutável:

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

### Modelo de Política

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### Modelo de Aprovação

- Contado por `actor.id` distintos.
- Pode incluir `comment` e `expires_at` opcionais.
- Pode ser revogado (antes da execução).
- A execução requer aprovações para satisfazer a política **no momento da execução**.

## Desenvolvimento

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

## Estrutura do Projeto

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

## Licença

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
