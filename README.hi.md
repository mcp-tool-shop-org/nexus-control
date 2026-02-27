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
  <a href="https://codecov.io/gh/mcp-tool-shop-org/nexus-control"><img src="https://codecov.io/gh/mcp-tool-shop-org/nexus-control/branch/main/graph/badge.svg" alt="Codecov" /></a>
  <a href="https://pypi.org/project/nexus-control/"><img src="https://img.shields.io/pypi/v/nexus-control" alt="PyPI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-control/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---



एक सरल नियंत्रण प्रणाली जो "राउटर निष्पादित कर सकता है" को "संगठन सुरक्षित रूप से निष्पादित करने का निर्णय ले सकता है" में बदल देती है - और यह क्रिप्टोग्राफिक प्रमाण के साथ किया जाता है।

## ब्रांड + उपकरण पहचान संख्या।

| मुख्य। | मूल्य। |
|-----|-------|
| ब्रांड / पुन: बिक्री। | `nexus-control` |
| पाइथन पैकेज। | `nexus_control` |
| लेखक। | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| लाइसेंस। | एमआईटी (MIT) |

## मूल वादा।

प्रत्येक क्रियान्वयन निम्नलिखित से जुड़ा होता है:
- एक **निर्णय** (अनुरोध + नीति)
- एक **नीति** (अनुमोदन नियम, अनुमत तरीके, सीमाएं)
- एक **अनुमोदन का रिकॉर्ड** (किसने अनुमोदन किया, कब, किस टिप्पणी के साथ)
- एक **नेक्सस-राउटर रन आईडी** (पूर्ण क्रियान्वयन ऑडिट के लिए)
- एक **ऑडिट पैकेज** (शासन को क्रियान्वयन से जोड़ने वाला क्रिप्टोग्राफिक संबंध)

सब कुछ निर्यात करने योग्य, सत्यापित करने योग्य और फिर से चलाने योग्य है।

कृपया [ARCHITECTURE.md](ARCHITECTURE.md) फ़ाइल देखें, जिसमें पूरी अवधारणा और डिज़ाइन संबंधी गारंटी दी गई हैं।

## स्थापना।

```bash
pip install nexus-control
```

स्रोत से:
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## शुरुआत कैसे करें।

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

## MCP उपकरण।

| उपकरण। | विवरण। |
|------|-------------|
| `nexus-control.request` | एक निष्पादन अनुरोध बनाएं, जिसमें लक्ष्य, नीति और अनुमोदनकर्ता शामिल हों। |
| `nexus-control.approve` | किसी अनुरोध को स्वीकृत करें (यह एन-ऑफ-एम अनुमोदन प्रणाली का समर्थन करता है)। |
| `nexus-control.execute` | अनुमोदित अनुरोध को नेक्सस-राउटर के माध्यम से क्रियान्वित करें। |
| `nexus-control.status` | अनुरोध की स्थिति और उससे जुड़े रन की स्थिति प्राप्त करें। |
| `nexus-control.inspect` | केवल पढ़ने की अनुमति वाले डेटा की जांच करने की क्षमता, जिसका आउटपुट मनुष्यों द्वारा आसानी से समझा जा सके। |
| `nexus-control.template.create` | एक नामित, अपरिवर्तनीय नीति टेम्पलेट बनाएं। |
| `nexus-control.template.get` | नाम के आधार पर एक टेम्पलेट प्राप्त करें। |
| `nexus-control.template.list` | सभी टेम्प्लेट की सूची प्रदर्शित करें, जिसमें वैकल्पिक रूप से लेबल के आधार पर फ़िल्टर करने का विकल्प भी हो। |
| `nexus-control.export_bundle` | एक निर्णय को एक ऐसे पैकेज के रूप में निर्यात करें जो आसानी से स्थानांतरित किया जा सके और जिसकी प्रामाणिकता की पुष्टि की जा सके। |
| `nexus-control.import_bundle` | एक ऐसे बंडल को इम्पोर्ट करें जिसमें संघर्ष समाधान (conflict resolution) के तरीके और पुनः सत्यापन (replay validation) शामिल हों। |
| `nexus-control.export_audit_package` | निर्यात लेखा परीक्षा पैकेज, शासन को क्रियान्वयन से जोड़ता है। |

## ऑडिट पैकेज (संस्करण 0.6.0)

एक एकल JSON फ़ाइल जो क्रिप्टोग्राफिक रूप से निम्नलिखित चीज़ों को जोड़ती है:
- **क्या अनुमति दी गई थी** (नियंत्रण बंडल)
- **वास्तव में क्या चलाया गया था** (राउटर निष्पादन)
- **यह क्यों अनुमति दी गई थी** (नियंत्रण-राउटर संबंध)

एक सत्यापित "बाइंडिंग डाइजेस्ट" में परिवर्तित करें।

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

| मोड। | विवरण। | उपयोग परिदृश्य। |
|------|-------------|----------|
| **Reference** | `रन_आईडी` + `राउटर_डाइजेस्ट` | सीआई, आंतरिक प्रणालियाँ। |
| **Embedded** | इसमें राउटर का पूरा पैकेज शामिल है। | नियामक, दीर्घकालिक अभिलेखागार। |

## निर्णय टेम्पलेट्स (संस्करण 0.3.0)

ऐसे नामित और अपरिवर्तनीय नीति समूह जिन्हें विभिन्न निर्णयों में बार-बार उपयोग किया जा सकता है:

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

## निर्णय चक्र (संस्करण 0.4.0)

गणना की गई जीवनचक्र अवधि, जिसमें बाधा डालने वाले कारणों और समय-सीमा का विवरण शामिल है:

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

## निर्यात/आयात पैकेज (संस्करण 0.5.0)

पोर्टेबल, अखंडता-सत्यापित निर्णय पैकेज:

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

संघर्ष समाधान के तरीके: `reject_on_conflict` (संघर्ष होने पर अस्वीकार करें), `new_decision_id` (नया निर्णय आईडी), `overwrite` (अतिलेखन)।

## डेटा मॉडल।

### इवेंट-आधारित डिज़ाइन।

सभी अवस्थाएँ एक अपरिवर्तनीय घटना लॉग को फिर से चलाने से प्राप्त होती हैं।

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

### नीति मॉडल।

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### अनुमोदन मॉडल।

- यह गिनती विशिष्ट `actor.id` के आधार पर की जाती है।
- इसमें `comment` शामिल हो सकता है और वैकल्पिक रूप से `expires_at` भी हो सकता है।
- इसे रद्द किया जा सकता है (निष्पादन से पहले)।
- निष्पादन के लिए, नीति का अनुपालन **निष्पादन के समय** सुनिश्चित करने के लिए अनुमोदन की आवश्यकता होती है।

## विकास।

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

## परियोजना की संरचना।

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

## सुरक्षा और डेटा का दायरा।

- **जिन डेटा तक पहुंचा जाता है:** मेमोरी में संग्रहीत अनुमोदन नीतियां, निष्पादन ऑडिट लॉग (SHA-256 अखंडता), टूल कॉल मेटाडेटा। सभी डेटा अस्थायी होते हैं, जब तक कि उन्हें स्पष्ट रूप से निर्यात न किया जाए।
- **जिन डेटा तक नहीं पहुंचा जाता:** नेक्सस-राउटर के साथ संचार को छोड़कर, कोई भी नेटवर्क अनुरोध नहीं, कोई भी फ़ाइल सिस्टम लेखन (ऑडिट निर्यात उपयोगकर्ता द्वारा निर्दिष्ट पथों पर भेजे जाते हैं), कोई भी ऑपरेटिंग सिस्टम क्रेडेंशियल, कोई भी टेलीमेट्री डेटा।
- **आवश्यक अनुमतियाँ:** केवल पायथन प्रक्रिया की अनुमतियों से अधिक कुछ भी नहीं।

सुरक्षा संबंधी कमजोरियों की रिपोर्ट करने के लिए, [SECURITY.md](SECURITY.md) देखें।

## स्कोरकार्ड।

| श्रेणी। | स्कोर |
|----------|-------|
| ए. सुरक्षा | 10/10 |
| बी. त्रुटि प्रबंधन | 10/10 |
| सी. ऑपरेटर दस्तावेज़ | 10/10 |
| डी. शिपिंग स्वच्छता | 10/10 |
| ई. पहचान (सॉफ्टवेयर) | 10/10 |
| **Overall** | **50/50** |

> [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck) के साथ मूल्यांकित।

## लाइसेंस।

एमआईटी — विवरण के लिए [लाइसेंस](LICENSE) देखें।

---

[MCP टूल शॉप](https://mcp-tool-shop.github.io/) द्वारा निर्मित।
