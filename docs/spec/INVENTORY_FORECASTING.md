# Domain Logic: Inventory Forecasting

## Algorithm: Simple Linear Regression
The application uses a client-side linear regression algorithm (`src/utils/forecasting.js`) to project future inventory depletion dates.

## Inputs
*   `historicalData`: Array of `{ date: Date, sales: number }`.
*   `daysToForecast`: Integer (Default: 30).

## Math Implementation
1.  **Data Preparation:** Maps dates to integer indices ($x=0, 1, 2...$).
2.  **Slope ($m$) & Intercept ($b$):**
    $$m = \frac{n(\sum xy) - (\sum x)(\sum y)}{n(\sum x^2) - (\sum x)^2}$$
    $$b = \frac{\sum y - m(\sum x)}{n}$$
3.  **Projection:**
    For next 30 days: $y_{pred} = m(x_{next}) + b$.

## Usage in UI
*   **Stockout Date:** The date where the projected regression line crosses `y=0`.
*   **Visualization:** Renders a dashed line on the Sales/Inventory chart extending into the future.

## Limitations
*   **Seasonality:** The current linear model does *not* account for weekly or seasonal cycles (e.g., Black Friday spikes).
*   **Accuracy:** Best for stable, high-volume products.
