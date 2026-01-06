
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceLayoutItem {
    id: string;
    type: string;
    content?: string;
    // RGL properties
    x: number;
    y: number;
    w: number;
    h: number;
}

interface OrderData {
    number: string;
    date_created: string;
    line_items: any[];
    total: string;
    total_tax: string;
    currency: string;
    billing?: any;
    shipping?: any;
    [key: string]: any;
}

/**
 * Generates specific invoice PDF based on layout and order data
 */
export const generateInvoicePDF = (order: OrderData, grid: any[], items: any[], templateName: string = 'Invoice') => {
    // 1. Initialize PDF
    // A4 size: 210mm x 297mm
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297

    // Grid System: 12 Cols
    const colWidth = pageWidth / 12;
    // Row Height is virtual in RGL (e.g. 30px), we need to map y-coord to mm.
    // Assuming 30px ~ 8mm roughly? or just relative.
    // Let's approximate: RGL rowHeight=30. In 96dpi, 30px = 7.9mm.
    const rowHeightMM = 8;

    // Helper to get coordinates
    const getRect = (item: InvoiceLayoutItem) => {
        return {
            x: item.x * colWidth, // 0-12
            y: item.y * rowHeightMM + 10, // Margin top 10mm
            w: item.w * colWidth,
            h: item.h * rowHeightMM
        };
    };

    // Sort items by Y to render top-down
    const sortedGrid = [...grid].sort((a, b) => a.y - b.y);

    sortedGrid.forEach(layoutItem => {
        const itemConfig = items.find(i => i.id === layoutItem.i);
        if (!itemConfig) return;

        const { x, y, w, h } = getRect(layoutItem);
        const type = itemConfig.type;
        const content = itemConfig.content;

        if (type === 'text') {
            let text = content || '';
            // Handlebars replacement
            text = text.replace(/{{(.*?)}}/g, (_: any, key: string) => {
                const k = key.trim();
                // Deep access could be handled here if needed
                return order[k] || `{{${k}}}`;
            });

            // Render Text
            // Simple approach: fit text in box? or just print.
            doc.setFontSize(10);
            doc.text(text, x + 2, y + 5);
            // Optional: Draw box for debug/design parity
            // doc.rect(x, y, w, h);
        }
        else if (type === 'image') {
            // Placeholder for image
            doc.setFillColor(240, 240, 240);
            doc.rect(x, y, w, h, 'F');
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Image', x + w / 2, y + h / 2, { align: 'center' });
            doc.setTextColor(0);
        }
        else if (type === 'order_table') {
            // Use AutoTable
            // We need to handle the Y position carefully. 
            // AutoTable adds data usually.

            const tableData = order.line_items.map(p => [
                p.name,
                p.quantity,
                formatPrice(p.price, order.currency),
                formatPrice(p.total, order.currency)
            ]);

            autoTable(doc, {
                startY: y,
                margin: { left: x },
                tableWidth: w, // Constrain width? autoTable usually takes full width or specific
                head: [['Item', 'Qty', 'Price', 'Total']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [66, 66, 66] }
            });
        }
        else if (type === 'totals') {
            // Render Totals
            const startX = x + (w / 2); // Align right-ish side of box
            let currentY = y + 5;

            doc.setFontSize(10);

            doc.text(`Subtotal: ${formatPrice(Number(order.total) - Number(order.total_tax), order.currency)}`, x + w - 5, currentY, { align: 'right' });
            currentY += 5;
            doc.text(`Tax: ${formatPrice(order.total_tax, order.currency)}`, x + w - 5, currentY, { align: 'right' });
            currentY += 6;
            doc.setFont("helvetica", "bold");
            doc.text(`Total: ${formatPrice(order.total, order.currency)}`, x + w - 5, currentY, { align: 'right' });
            doc.setFont("helvetica", "normal");
        }
    });

    // Save
    doc.save(`Invoice_${order.number}.pdf`);
};

function formatPrice(amount: string | number, currency: string) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(amount));
}
