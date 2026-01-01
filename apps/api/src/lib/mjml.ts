
import mjml2html from 'mjml';

// Types based on Frontend structure
interface BlockContent {
    text?: string;
    url?: string;
    alt?: string;
    link?: string;
    html?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    companyName?: string;
    address?: string;
    name?: string;
    price?: string;
    imageUrl?: string;
}

interface BlockStyles {
    padding?: string;
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    lineHeight?: string;
    textAlign?: string;
    borderRadius?: string;
    width?: string;
    height?: string;
    fontFamily?: string;
}

interface Block {
    id: string;
    type: 'section' | 'text' | 'image' | 'button' | 'spacer' | 'divider' | 'social' | 'html' | 'footer' | 'product';
    content: BlockContent;
    styles: BlockStyles;
    layout?: string;
    columns?: Block[][];
}

interface TemplateData {
    blocks: Block[];
    globalStyles: {
        backgroundColor?: string;
        fontFamily?: string;
        contentWidth?: string;
    };
}

// Helper to map style keys to MJML attributes
const mapStyles = (styles: BlockStyles, type: string): string => {
    const s = styles || {};
    const attrs: string[] = [];

    // Common
    if (s.padding) attrs.push(`padding="${s.padding}"`);
    if (s.backgroundColor) attrs.push(`background-color="${s.backgroundColor}"`);

    // Text specific
    if (type === 'text' || type === 'button') {
        if (s.color) attrs.push(`color="${s.color}"`);
        if (s.fontSize) attrs.push(`font-size="${s.fontSize}"`);
        if (s.lineHeight) attrs.push(`line-height="${s.lineHeight}"`);
        if (s.fontFamily) attrs.push(`font-family="${s.fontFamily}"`);
        if (s.textAlign) attrs.push(`align="${s.textAlign}"`);
    }

    // Button specific
    if (type === 'button') {
        if (s.borderRadius) attrs.push(`border-radius="${s.borderRadius}"`);
        if (s.width) attrs.push(`width="${s.width}"`);
    }

    // Image
    if (type === 'image') {
        if (s.width) attrs.push(`width="${s.width.replace('%', 'px')}"`); // MJML often prefers px or % but usually inside 600px
        if (s.textAlign) attrs.push(`align="${s.textAlign}"`);
    }

    // Divider
    if (type === 'divider') {
        if (s.color) attrs.push(`border-color="${s.color}"`);
        if (s.width) attrs.push(`width="${s.width}"`);
    }

    // Spacer
    if (type === 'spacer') {
        if (s.height) attrs.push(`height="${s.height}"`);
    }

    return attrs.join(' ');
};

const renderBlock = (block: Block): string => {
    const { type, content, styles } = block;
    const styleAttrs = mapStyles(styles, type);

    switch (type) {
        case 'text':
            return `<mj-text ${styleAttrs}>${content.text || ''}</mj-text>`;

        case 'image':
            return `<mj-image src="${content.url}" alt="${content.alt || ''}" ${styleAttrs} />`;

        case 'button':
            return `<mj-button href="${content.link || '#'}" ${styleAttrs}>${content.text || 'Button'}</mj-button>`;

        case 'divider':
            return `<mj-divider border-width="1px" ${styleAttrs} />`;

        case 'spacer':
            return `<mj-spacer height="${styles?.height || '20px'}" />`;

        case 'social':
            // Simple social block
            return `
            <mj-social mode="horizontal" ${styleAttrs}>
                ${content.facebook ? `<mj-social-element name="facebook" href="${content.facebook}"></mj-social-element>` : ''}
                ${content.twitter ? `<mj-social-element name="twitter" href="${content.twitter}"></mj-social-element>` : ''}
                ${content.instagram ? `<mj-social-element name="instagram" href="${content.instagram}"></mj-social-element>` : ''}
            </mj-social>`;

        case 'footer':
            return `
            <mj-text align="center" font-size="12px" color="#94a3b8">
                <p>${content.companyName || 'Your Company'}</p>
                <p>${content.address || 'Address'}</p>
                <p><a href="{{unsubscribe_url}}" style="color: #94a3b8;">Unsubscribe</a></p>
            </mj-text>
            `;

        case 'html':
            return `<mj-raw>${content.html || ''}</mj-raw>`;

        case 'product':
            // Custom Product Card
            return `
            <mj-group>
                <mj-column width="100%">
                    <mj-image src="${content.imageUrl}" alt="${content.name}" width="200px" />
                    <mj-text align="center" font-size="18px" font-weight="bold">${content.name}</mj-text>
                    <mj-text align="center" font-size="16px" color="#333">${content.price}</mj-text>
                    <mj-button href="${content.link || '#'}" background-color="#1e293b" color="white">Buy Now</mj-button>
                </mj-column>
            </mj-group>
            `;

        default:
            return '';
    }
};

const renderSection = (block: Block): string => {
    // If it's not a section type (i.e. root level items in the old design were sometimes just blocks),
    // we need to wrap them because MJML body expects Sections.
    // However, our data model has explicit 'section' type with 'columns'.
    // If we encounter a non-section block at root, we wrap it in a generic section.

    if (block.type !== 'section') {
        return `
        <mj-section padding="${block.styles?.padding || '0px'}" background-color="${block.styles?.backgroundColor || 'transparent'}">
            <mj-column width="100%">
                ${renderBlock(block)}
            </mj-column>
        </mj-section>
        `;
    }

    // It IS a section with columns
    const columns = block.columns || [];

    // Layout logic mapping
    // 1-col -> 100%
    // 2-col -> 50% 50%
    // 1-2-col -> 33% 66%

    const layout = block.layout || '1-col';
    let widths: string[] = [];
    if (layout === '1-col') widths = ['100%'];
    else if (layout === '2-col') widths = ['50%', '50%'];
    else if (layout === '3-col') widths = ['33.33%', '33.33%', '33.33%'];
    else if (layout === '1-2-col') widths = ['33.33%', '66.66%'];
    else if (layout === '2-1-col') widths = ['66.66%', '33.33%'];

    const columnsHtml = columns.map((colBlocks, index) => {
        const width = widths[index] || '100%';
        const colContent = colBlocks.map(b => renderBlock(b)).join('\n');
        return `
        <mj-column width="${width}">
            ${colContent}
        </mj-column>
        `;
    }).join('\n');

    return `
    <mj-section padding="${block.styles?.padding || '20px'}" background-color="${block.styles?.backgroundColor || 'transparent'}">
        ${columnsHtml}
    </mj-section>
    `;
};

export const generateMjml = (data: TemplateData): string => {
    const { blocks, globalStyles } = data;

    const bodyContent = blocks.map(b => renderSection(b)).join('\n');

    return `
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-all font-family="${globalStyles.fontFamily || 'Arial, sans-serif'}" />
          <mj-text font-size="16px" color="#333333" line-height="1.5" />
          <mj-button background-color="#3b82f6" color="white" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="${globalStyles.backgroundColor || '#f1f5f9'}" width="${globalStyles.contentWidth || '600px'}">
        ${bodyContent}
      </mj-body>
    </mjml>
    `;
};

export const compileToHtml = (data: TemplateData) => {
    try {
        const mjml = generateMjml(data);
        const { html, errors } = mjml2html(mjml, {
            validationLevel: 'soft',
            minify: true
        });

        if (errors && errors.length > 0) {
            console.warn('MJML Compilation Warnings:', errors);
        }

        return { html, mjml, errors };
    } catch (error) {
        console.error('MJML Compilation Error:', error);
        throw error;
    }
};
