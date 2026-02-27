<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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



Un plano de control ligero que transforma "el enrutador puede ejecutar" en "la organización puede decidir de forma segura ejecutar" con una prueba criptográfica.

## Marca + ID de la herramienta

| Clave | Valor |
|-----|-------|
| Marca / repositorio | `nexus-control` |
| Paquete de Python | `nexus_control` |
| Autor | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| Licencia | MIT |

## Promesa fundamental

Cada ejecución está vinculada a:
- Una **decisión** (la solicitud + la política)
- Una **política** (reglas de aprobación, modos permitidos, restricciones)
- Un **registro de aprobación** (quién aprobó, cuándo, con qué comentario)
- Un `run_id` de **nexus-router** (para una auditoría completa de la ejecución)
- Un **paquete de auditoría** (vinculación criptográfica de la gobernanza a la ejecución)

Todo es exportable, verificable y reproducible.

> Consulte [ARCHITECTURE.md](ARCHITECTURE.md) para obtener el modelo mental completo y las garantías de diseño.

## Instalación

```bash
pip install nexus-control
```

O desde el código fuente:
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## Guía de inicio rápido

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

## Herramientas MCP

| Herramienta | Descripción |
|------|-------------|
| `nexus-control.request` | Crea una solicitud de ejecución con objetivo, política y aprobadores. |
| `nexus-control.approve` | Aprueba una solicitud (admite aprobaciones N de M). |
| `nexus-control.execute` | Ejecuta la solicitud aprobada a través de nexus-router. |
| `nexus-control.status` | Obtén el estado de la solicitud y el estado de la ejecución vinculada. |
| `nexus-control.inspect` | Inspección de solo lectura con salida legible por humanos. |
| `nexus-control.template.create` | Crea una plantilla de política con nombre e inmutable. |
| `nexus-control.template.get` | Recupera una plantilla por nombre. |
| `nexus-control.template.list` | Lista todas las plantillas con filtrado opcional por etiqueta. |
| `nexus-control.export_bundle` | Exporta una decisión como un paquete portátil y con integridad verificada. |
| `nexus-control.import_bundle` | Importa un paquete con modos de conflicto y validación de reproducción. |
| `nexus-control.export_audit_package` | Exporta el paquete de auditoría que vincula la gobernanza a la ejecución. |

## Paquetes de auditoría (v0.6.0)

Un único artefacto JSON que vincula criptográficamente:
- **Lo que se permitió** (paquete de control)
- **Lo que realmente se ejecutó** (ejecución del enrutador)
- **Por qué se permitió** (enlace de control-enrutador)

En un único `binding_digest` verificable.

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

Dos modos de enrutador:

| Modo | Descripción | Caso de uso |
|------|-------------|----------|
| **Reference** | `run_id` + `router_digest` | CI, sistemas internos |
| **Embedded** | Paquete de enrutador completo incluido | Reguladores, archivo a largo plazo |

## Plantillas de decisión (v0.3.0)

Paquetes de políticas con nombre e inmutables que se pueden reutilizar en diferentes decisiones:

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

## Ciclo de vida de la decisión (v0.4.0)

Ciclo de vida calculado con razones de bloqueo y línea de tiempo:

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

## Exportar/Importar paquetes (v0.5.0)

Paquetes de decisión portátiles y con integridad verificada:

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

Modos de conflicto: `reject_on_conflict`, `new_decision_id`, `overwrite`

## Modelo de datos

### Diseño basado en eventos

Todo el estado se deriva de la reproducción de un registro de eventos inmutable:

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

### Modelo de políticas

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### Modelo de aprobación

- Contado por `actor.id` distintos.
- Puede incluir `comment` y `expires_at` opcional.
- Se puede revocar (antes de la ejecución).
- La ejecución requiere aprobaciones para satisfacer la política **en el momento de la ejecución**.

## Desarrollo

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

## Estructura del proyecto

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

## Seguridad y alcance de los datos

- **Datos a los que se accede:** políticas de aprobación en memoria, registros de auditoría de ejecución (integridad SHA-256), metadatos de llamadas a herramientas. Todos los datos son efímeros a menos que se exporten explícitamente.
- **Datos a los que NO se accede:** no hay solicitudes de red más allá de la comunicación de nexus-router, no hay escrituras en el sistema de archivos (las exportaciones de auditoría se dirigen a las rutas especificadas por el llamador), no hay credenciales del sistema operativo, no hay telemetría.
- **Permisos requeridos:** ninguno más allá de los permisos del proceso de Python.

Consulte [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

## Tabla de evaluación

| Categoría | Puntuación |
|----------|-------|
| A. Seguridad | 10/10 |
| B. Manejo de errores | 10/10 |
| C. Documentación para el operador | 10/10 |
| D. Higiene durante el envío | 10/10 |
| E. Identificación (suave) | 10/10 |
| **Overall** | **50/50** |

> Evaluado con [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck)

## Licencia

Licencia MIT: consulte [LICENSE](LICENSE) para obtener más detalles.

---

Desarrollado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
