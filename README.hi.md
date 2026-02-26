<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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



एक पतला नियंत्रण परत जो "राउटर निष्पादित कर सकता है" को "संगठन सुरक्षित रूप से निष्पादित करने का निर्णय ले सकता है" में बदल देता है - क्रिप्टोग्राफिक प्रमाण के साथ।

## ब्रांड + टूल आईडी

| कुंजी | मान |
| ----- | ------- |
| ब्रांड / रिपॉजिटरी | `nexus-control` |
| पाइथन पैकेज | `nexus_control` |
| लेखक | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| लाइसेंस | एमआईटी |

## मुख्य वादा

प्रत्येक निष्पादन निम्नलिखित से जुड़ा होता है:
- एक **निर्णय** (अनुरोध + नीति)
- एक **नीति** (अनुमोदन नियम, अनुमत मोड, प्रतिबंध)
- एक **अनुमोदन अनुक्रम** (किसने अनुमोदन किया, कब, किस टिप्पणी के साथ)
- एक **नेक्सस-राउटर रन_आईडी** (पूर्ण निष्पादन ऑडिट के लिए)
- एक **ऑडिट पैकेज** (शासन को निष्पादन से क्रिप्टोग्राफिक रूप से जोड़ने के लिए)

सब कुछ निर्यात करने योग्य, सत्यापित करने योग्य और पुनः चलाने योग्य है।

> पूर्ण मानसिक मॉडल और डिज़ाइन गारंटी के लिए [ARCHITECTURE.md](ARCHITECTURE.md) देखें।

## स्थापना

```bash
pip install nexus-control
```

या स्रोत से:
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## त्वरित शुरुआत

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

## एमसीपी उपकरण

| उपकरण | विवरण |
| ------ | ------------- |
| `nexus-control.request` | एक निष्पादन अनुरोध बनाएं जिसमें लक्ष्य, नीति और अनुमोदक शामिल हों |
| `nexus-control.approve` | एक अनुरोध को स्वीकृत करें (एन-ऑफ-एम अनुमोदन का समर्थन करता है) |
| `nexus-control.execute` | नेक्सस-राउटर के माध्यम से स्वीकृत अनुरोध निष्पादित करें |
| `nexus-control.status` | अनुरोध की स्थिति और संबंधित रन स्थिति प्राप्त करें |
| `nexus-control.inspect` | मानव-पठनीय आउटपुट के साथ केवल-पढ़ने योग्य निरीक्षण |
| `nexus-control.template.create` | एक नामित, अपरिवर्तनीय नीति टेम्पलेट बनाएं |
| `nexus-control.template.get` | नाम से एक टेम्पलेट प्राप्त करें |
| `nexus-control.template.list` | वैकल्पिक लेबल फ़िल्टरिंग के साथ सभी टेम्पलेट्स की सूची बनाएं |
| `nexus-control.export_bundle` | एक निर्णय को एक पोर्टेबल, अखंडता-सत्यापित बंडल के रूप में निर्यात करें |
| `nexus-control.import_bundle` | संघर्ष मोड और पुनः सत्यापन के साथ एक बंडल आयात करें |
| `nexus-control.export_audit_package` | शासन को निष्पादन से जोड़ने वाला ऑडिट पैकेज निर्यात करें |

## ऑडिट पैकेज (v0.6.0)

एक एकल JSON आर्टिफैक्ट जो क्रिप्टोग्राफिक रूप से जोड़ता है:
- **क्या अनुमति दी गई थी** (नियंत्रण बंडल)
- **वास्तव में क्या चला** (राउटर निष्पादन)
- **यह क्यों अनुमति दी गई थी** (नियंत्रण-राउटर लिंक)

एक सत्यापन योग्य `binding_digest` में।

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

दो राउटर मोड:

| मोड | विवरण | उपयोग का मामला |
| ------ | ------------- | ---------- |
| **Reference** | `run_id` + `router_digest` | सीआई, आंतरिक सिस्टम |
| **Embedded** | पूर्ण राउटर बंडल शामिल है | नियामक, दीर्घकालिक अभिलेखागार |

## निर्णय टेम्पलेट (v0.3.0)

नामित, अपरिवर्तनीय नीति बंडल जिनका उपयोग निर्णयों में किया जा सकता है:

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

## निर्णय जीवनचक्र (v0.4.0)

अवरुद्ध कारणों और समयरेखा के साथ गणना किया गया जीवनचक्र:

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

## निर्यात/आयात बंडल (v0.5.0)

पोर्टेबल, अखंडता-सत्यापित निर्णय बंडल:

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

संघर्ष मोड: `reject_on_conflict`, `new_decision_id`, `overwrite`

## डेटा मॉडल

### इवेंट-सोर्स डिज़ाइन

सभी स्थिति एक अपरिवर्तनीय घटना लॉग को पुनः चलाने से प्राप्त होती है:

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

### नीति मॉडल

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### अनुमोदन मॉडल

- विशिष्ट `actor.id` द्वारा गिना जाता है
- इसमें `comment` और वैकल्पिक `expires_at` शामिल हो सकते हैं
- इसे रद्द किया जा सकता है (निष्पादन से पहले)
- निष्पादन के लिए नीति को संतुष्ट करने के लिए अनुमोदन की आवश्यकता होती है **निष्पादन के समय**

## विकास

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

## परियोजना संरचना

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

## लाइसेंस

एमआईटी

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
