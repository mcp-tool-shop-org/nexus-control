<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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



一个精简的控制层，将“路由器可以执行”转化为“组织可以安全地决定执行”，并提供密码学证明。

## 品牌 + 工具 ID

| 密钥 | 值 |
|-----|-------|
| 品牌 / 仓库 | `nexus-control` |
| Python 包 | `nexus_control` |
| 作者 | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| 许可证 | MIT |

## 核心承诺

每次执行都与以下内容相关联：
- 一个**决策**（请求 + 策略）
- 一个**策略**（审批规则、允许模式、约束）
- 一个**审批记录**（谁批准的、何时批准的、以及审批意见）
- 一个**nexus-router 运行 ID**（用于完整的执行审计）
- 一个**审计包**（将治理与执行进行密码学绑定）

所有内容都可以导出、验证和重放。

> 请参阅 [ARCHITECTURE.md](ARCHITECTURE.md)，了解完整的思维模型和设计保证。

## 安装

```bash
pip install nexus-control
```

或者从源代码安装：
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## 快速开始

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

## MCP 工具

| 工具 | 描述 |
|------|-------------|
| `nexus-control.request` | 创建包含目标、策略和审批人的执行请求。 |
| `nexus-control.approve` | 审批请求（支持 N-of-M 审批）。 |
| `nexus-control.execute` | 通过 nexus-router 执行已批准的请求。 |
| `nexus-control.status` | 获取请求状态和相关运行状态。 |
| `nexus-control.inspect` | 只读的内省，并提供可读的输出。 |
| `nexus-control.template.create` | 创建命名且不可变的策略模板。 |
| `nexus-control.template.get` | 通过名称检索模板。 |
| `nexus-control.template.list` | 列出所有模板，并可选择通过标签进行过滤。 |
| `nexus-control.export_bundle` | 将决策导出为可移植且具有完整性验证的包。 |
| `nexus-control.import_bundle` | 导入包，并处理冲突模式和重放验证。 |
| `nexus-control.export_audit_package` | 导出审计包，将治理与执行进行绑定。 |

## 审计包 (v0.6.0)

一个 JSON 文件，通过密码学方式绑定以下内容：
- **允许的内容**（控制包）
- **实际运行的内容**（路由器执行）
- **允许的原因**（控制-路由器链接）

形成一个可验证的 `binding_digest`。

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

两种路由器模式：

| 模式 | 描述 | 用例 |
|------|-------------|----------|
| **Reference** | `run_id` + `router_digest` | CI、内部系统 |
| **Embedded** | 包含完整的路由器包 | 监管机构、长期归档 |

## 决策模板 (v0.3.0)

命名且不可变的策略包，可以在决策之间重用：

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

## 决策生命周期 (v0.4.0)

计算出的生命周期，包含阻止原因和时间线：

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

## 导出/导入包 (v0.5.0)

可移植且具有完整性验证的决策包：

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

冲突模式：`reject_on_conflict`、`new_decision_id`、`overwrite`

## 数据模型

### 事件溯源设计

所有状态都是通过重放不可变的事件日志派生的：

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

### 策略模型

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### 审批模型

- 按照不同的 `actor.id` 进行计数
- 可以包含 `comment` 以及可选的 `expires_at`
- 可以撤销（在执行之前）
- 执行需要审批，以满足策略，**在执行时**

## 开发

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

## 项目结构

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

## 安全性和数据范围

- **访问的数据：** 内存中的审批策略、执行审计日志（SHA-256 完整性）、工具调用元数据。 除非明确导出，否则所有数据都是临时的。
- **未访问的数据：** 不进行任何网络请求，除了与 nexus-router 的通信；不进行任何文件系统写入（审计导出会写入调用者指定的路径）；不访问任何操作系统凭据；不收集任何遥测数据。
- **所需的权限：** 仅需 Python 进程的权限。

请参阅 [SECURITY.md](SECURITY.md)，了解漏洞报告。

## 评估标准

| 类别 | 评分 |
|----------|-------|
| A. 安全性 | 10/10 |
| B. 错误处理 | 10/10 |
| C. 操作员文档 | 10/10 |
| D. 运输卫生 | 10/10 |
| E. 身份验证（软件） | 10/10 |
| **Overall** | **50/50** |

> 使用 [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck) 进行评估。

## 许可证

MIT 协议 — 详情请参见 [LICENSE](LICENSE)。

---

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建。
