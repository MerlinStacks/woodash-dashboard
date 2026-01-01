# Technical Spec: PDF Generation Module

## Overview
The PDF Generation module provides a WYSIWYG "Invoice Builder" and a client-side rendering engine to creating high-fidelity PDFs.

## Architecture
-   **Editor:** `apps/web/src/pages/InvoiceBuilder.jsx`
-   **Renderer:** `apps/web/src/components/InvoiceRenderer.jsx`
-   **Output:** `html2canvas` + `jspdf`

## The Builder (Drag-and-Drop)
Uses `framer-motion`'s `Reorder.Group` to handle a grid-based layout system.

### Layout Model
The layout is a nested JSON structure:
1.  **Rows**: Vertical stack of containers.
2.  **Columns**: Horizontal divisions within a row (resizable via `%` width).
3.  **Blocks**: Content widgets (Header, Text, Line Items Table).

### Key Features
-   **ResizeObserver:** Auto-scales the canvas to fit the user's screen while maintaining A4 aspect ratio (approx `794px` x `1123px`).
-   **Font Picker:** Dynamically loads Google Fonts by injecting `<link>` tags into the DOM.
-   **Live Preview:** Uses real `PREVIEW_DATA` to render text blocks so users see exactly what the invoice will look like.

## Rendering Strategy (Client-Side)
Unlike traditional server-side PDF generation, this app generates PDFs **in the browser**.

1.  **Capture:** The `InvoiceRenderer` renders into a hidden container `.invoice-print-area`.
2.  **Rasterize:** `html2canvas` captures the DOM at 2x scale (Retina quality).
3.  **PDF-ify:** `jspdf` places the image onto an A4 canvas.
4.  **Multi-Page Logic:**
    *   If the image height > A4 height, the script cuts the image and moves the "camera" down.
    *   `pdf.addPage()` is called in a loop until `heightLeft <= 0`.
    *   *Note:* This splits content strictly by pixels (images might get cut in half), acting like a "Screenshot Print".

### Pros/Cons
-   ✅ **Pros:** WYSIWYG; Supports complex CSS layouts (Glassmorphism, Gradients); No server load.
-   ❌ **Cons:** Text is rasterized (not selectable in PDF); File size can be larger than vector PDFs.
