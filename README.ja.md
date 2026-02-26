<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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



薄い制御層により、「ルーターが実行できる」という状態を、「組織が安全に実行することを決定できる」という状態に変換します。暗号学的証明を使用します。

## ブランド + ツールID

| キー | 値 |
| ----- | ------- |
| ブランド / リポジトリ | `nexus-control` |
| Pythonパッケージ | `nexus_control` |
| 作者 | [mcp-tool-shop](https://github.com/mcp-tool-shop) |
| ライセンス | MIT |

## 主要な約束

すべての実行は以下のものと紐付けられます。
- **決定** (リクエスト + ポリシー)
- **ポリシー** (承認ルール、許可されたモード、制約)
- **承認履歴** (誰がいつ、どのようなコメントで承認したか)
- **nexus-routerのrun_id** (完全な実行監査用)
- **監査パッケージ** (ガバナンスと実行を暗号的に紐付けるもの)

すべてをエクスポート、検証、および再実行できます。

> アーキテクチャ全体の概念モデルと設計保証については、[ARCHITECTURE.md](ARCHITECTURE.md) を参照してください。

## インストール

```bash
pip install nexus-control
```

または、ソースコードから：
```bash
git clone https://github.com/mcp-tool-shop-org/nexus-control
cd nexus-control
pip install -e ".[dev]"
```

## クイックスタート

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

## MCPツール

| ツール | 説明 |
| ------ | ------------- |
| `nexus-control.request` | 実行リクエストを作成します（目標、ポリシー、承認者を含む）。 |
| `nexus-control.approve` | リクエストを承認します（N-of-M承認をサポート）。 |
| `nexus-control.execute` | nexus-router経由で承認されたリクエストを実行します。 |
| `nexus-control.status` | リクエストの状態と関連する実行ステータスを取得します。 |
| `nexus-control.inspect` | 読み取り専用のインスペクションを行い、人間が読める形式で出力します。 |
| `nexus-control.template.create` | 名前付きで不変のポリシーテンプレートを作成します。 |
| `nexus-control.template.get` | 名前でテンプレートを取得します。 |
| `nexus-control.template.list` | オプションでラベルでフィルタリングして、すべてのテンプレートを一覧表示します。 |
| `nexus-control.export_bundle` | 決定を、ポータブルで整合性が検証されたバンドルとしてエクスポートします。 |
| `nexus-control.import_bundle` | 競合モードと再実行検証でバンドルをインポートします。 |
| `nexus-control.export_audit_package` | ガバナンスと実行を紐付ける監査パッケージをエクスポートします。 |

## 監査パッケージ (v0.6.0)

暗号的に以下のものを紐付ける単一のJSON形式のデータ：
- **許可された内容** (制御バンドル)
- **実際に実行された内容** (ルーターの実行)
- **許可された理由** (制御ルーターのリンク)

これらを検証可能な `binding_digest` にまとめます。

```python
from nexus_control import export_audit_package, verify_audit_package

# Export
result = export_audit_package(store, decision_id)
package = result.package

# Verify (6 independent checks, no short-circuiting)
verification = verify_audit_package(package)
assert verification.ok
```

ルーターのモード：

| モード | 説明 | ユースケース |
| ------ | ------------- | ---------- |
| **Reference** | `run_id` + `router_digest` | CI、内部システム |
| **Embedded** | 完全なルーターバンドルが含まれています | 規制当局、長期アーカイブ |

## 決定テンプレート (v0.3.0)

決定間で再利用できる名前付きで不変のポリシーバンドルです。

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

## 決定ライフサイクル (v0.4.0)

ブロック理由とタイムラインを含む計算されたライフサイクルです。

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

## バンドルのエクスポート/インポート (v0.5.0)

ポータブルで整合性が検証された決定バンドルです。

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

競合モード：`reject_on_conflict`、`new_decision_id`、`overwrite`

## データモデル

### イベントソーシング設計

すべての状態は、不変のイベントログを再生することによって導出されます。

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

### ポリシーモデル

```python
Policy(
    min_approvals=2,
    allowed_modes=["dry_run", "apply"],
    require_adapter_capabilities=["timeout"],
    max_steps=50,
    labels=["prod", "finance"],
)
```

### 承認モデル

- 異なる `actor.id` でカウントされます。
- `comment` とオプションの `expires_at` を含めることができます。
- 実行前に取り消すことができます。
- 実行には、ポリシーを満たすための承認が必要です（実行時）。

## 開発

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

## プロジェクト構造

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

## ライセンス

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
