# Technical Spec: Automation System

## Overview
The Automation System allows users to visually design "Flows" that react to store events (e.g., Order Created) and execute actions (e.g., Send Email) with partial logic (Waits, Splits).

## Architecture
-   **Frontend Builder:** `apps/web/src/pages/EmailFlowBuilder.jsx`
-   **Execution Engine:** `apps/web/src/workers/sync.worker.js` (currently handles basic triggers)
-   **Storage:** `automations` table in Dexie.js (local-first).

## Frontend Builder (ReactFlow)
The builder uses **ReactFlow** to render a node-based graph.

### Node Types
| Type | Description | Component |
| :--- | :--- | :--- |
| `trigger` | The starting event (e.g. `woocommerce_order_created`). | `TriggerNode` |
| `action` | Task to perform (e.g. `send_email`). | `ActionNode` |
| `condition` | If/Else logic (Pending implementation). | `ConditionNode` |
| `wait` | Delays execution (Time-based). | `WaitNode` |
| `split` | Random A/B testing split. | `SplitNode` |
| `end` | Visual terminator. | `EndNode` |

### Auto-Layout
Uses `dagre` graph library to automatically position nodes in a hierarchical Top-to-Bottom tree.
-   **Logic:** `getLayoutedElements` converts ReactFlow graph to Dagre graph, calculates positions (node width 280px, height 100px), and applies back to ReactFlow.

## Execution Logic (Worker)
Currently, the `sync.worker.js` listens for specific events during the sync process.
1.  **Event:** Worker fetches 50 Orders.
2.  **Check:** For each order, check if status changed.
3.  **Match:** Find active `automations` where `trigger_type === 'order_status_change'`.
4.  **Execute:** If conditions match, fire the Action (e.g. POST to `/api/proxy/overseek/v1/email/send`).

## Data Model (JSON Structure)
Automations are stored as a JSON blob in `dexie`:
```json
{
  "name": "Abandoned Cart Flow",
  "active": true,
  "conditions": {
    "nodes": [ ...ReactFlowNodes ],
    "edges": [ ...ReactFlowEdges ]
  },
  "trigger_type": "woocommerce_order_created"
}
```
*Note: The worker currently parses a simplified version. Future work requires a full graph traversal engine in the worker.*
