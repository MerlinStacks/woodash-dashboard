# Domain Logic: AI Assistant (The Oracle)

## Overview
The AI Assistant (`AIChat.jsx`) is a "Context-Aware" chatbot that runs in the browser but delegates complex reasoning to an LLM via **OpenRouter**.

## Architecture
1.  **Context Gathering (Local):**
    Before sending a prompt, the client queries `Dexie.js`:
    *   Fetches last 5 orders.
    *   Fetches low stock items (<5).
    *   Calculates total revenue for "Today".
2.  **System Prompt Generation:**
    Constructs a dynamic persona:
    ```text
    You are a Store Intelligence AI...
    LIVE SNAPSHOT: { revenue: $500, orders: 12, low_stock: [...] }
    ```
3.  **LLM Inference:** Sends prompt to OpenRouter (Model: `google/gemini-2.0-flash-exp`).

## Tool Use (Function Calling)
The AI can "Execute" tools by outputting a specific regex pattern: `[TOOL: name, {args}]`.
*   **Client Interception:** `AIChat.jsx` parses this pattern.
*   **Execution:** Runs the corresponding client-side function.
*   **Result Loop:** Feeds the result back to the AI as a `System` message.

### Available Tools
| Tool | Description | Side-Effect |
| :--- | :--- | :--- |
| `search_store_data` | Queries Dexie for Orders/Products. | Read-Only |
| `create_coupon` | POST to WC API to create a discount code. | **Write** |
| `get_sales_analytics` | Aggregates revenue for date range. | Read-Only |

## Proactive Insights
The Chat component runs a background check on mount:
*   If `low_stock.length > 0`, it auto-injects a message: "⚠️ Heads up! You have X items low on stock."
