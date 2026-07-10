# CSV Import

For migrating existing data (spreadsheets, DOORS/ReqIF exports converted to
CSV) into a project's trace graph. Two passes: import nodes first, then
links, using `externalId` to tie the two together.

## 1. Import nodes

`POST /api/projects/:projectId/trace/import/nodes`
Body: `{ "csv": "<raw CSV text>" }`

Columns:

| Column        | Required | Notes |
|---------------|----------|-------|
| `type`        | yes      | `requirement`, `design`, `verification`, or `risk` |
| `nodeSubtype` | yes      | e.g. `design_input`, `hazard` — must match the attached compliance pack's expected subtypes to be picked up by GapRules |
| `title`       | yes      | |
| `description` | no       | |
| `externalId`  | no       | ID from the source system (DOORS ID, spreadsheet row key). Re-importing the same `externalId` updates that row instead of creating a duplicate. Required if you plan to import links referencing this row. |
| `extra`       | no       | `outcome` for `verification` rows, `severity` for `risk` rows |

Example:

```csv
type,nodeSubtype,title,description,externalId,extra
requirement,design_input,Deliver max 500mL/hr,,REQ-001,
design,design_output,Flow control firmware spec,,DES-001,
verification,test_case,Flow rate accuracy test,,VER-001,pass
risk,hazard,Overinfusion,,RISK-001,
risk,mitigation,Flow rate hardware limiter,,RISK-002,
```

## 2. Import links

`POST /api/projects/:projectId/trace/import/links`
Body: `{ "csv": "<raw CSV text>" }`

Columns: `fromType,fromExternalId,toType,toExternalId,linkType`

`fromType`/`toType` are one of `RequirementNode`, `DesignElement`,
`VerificationRecord`, `RiskControl`. Endpoints are resolved by `externalId`
set during the nodes import — import nodes first.

Example:

```csv
fromType,fromExternalId,toType,toExternalId,linkType
RequirementNode,REQ-001,DesignElement,DES-001,implements
DesignElement,DES-001,VerificationRecord,VER-001,verifies
RiskControl,RISK-001,RiskControl,RISK-002,mitigated_by
RiskControl,RISK-001,VerificationRecord,VER-001,mitigates
RiskControl,RISK-002,VerificationRecord,VER-001,verifies
```

## Response

Both endpoints return `207 Multi-Status`:

```json
{ "created": 4, "errors": [{ "row": 3, "error": "title and nodeSubtype are required" }] }
```

Row numbers are 1-indexed with the header as row 1, so `row: 3` is the
second data row — matching what a spreadsheet user would see.

## Not yet supported

Native ReqIF (XML) import — flagged in `docs/STRATEGY.md` as a hard
requirement for DOORS-based aerospace customers, but out of scope for this
pass. A ReqIF-to-CSV converter would unblock it without changing this API.
