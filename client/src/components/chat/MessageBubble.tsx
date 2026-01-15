/**
 * MessageBubble - Renders a single message in the inbox.
 * Redesigned to display emails in a traditional email reader format (like Gmail/Outlook)
 * rather than chat bubbles. Shows sender header, date, and clean body layout.
 */
import { useState, useMemo, memo } from 'react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import { Check, AlertCircle, ChevronDown, ChevronUp, FileText, Download, Image as ImageIcon, File, Reply, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GravatarAvatar } from './GravatarAvatar';

interface MessageBubbleProps {
    message: {
        id: string;
        content: string;
        senderType: 'AGENT' | 'CUSTOMER' | 'SYSTEM';
        createdAt: string;
        isInternal: boolean;
        senderId?: string;
        readAt?: string | null;
        status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
        reactions?: Record<string, Array<{ userId: string; userName: string | null }>>;
        // Email tracking fields
        trackingId?: string | null;
        firstOpenedAt?: string | null;
        openCount?: number;
    };
    recipientName?: string;
    recipientEmail?: string;
    onImageClick?: (src: string) => void;
    onQuoteReply?: (message: { id: string; content: string; senderType: string }) => void;
    onReactionToggle?: (messageId: string, emoji: string) => Promise<void>;
}

/**
 * Parses email content to extract subject line and body.
 */
function parseEmailContent(content: string): { subject: string | null; body: string } {
    if (content.startsWith('Subject:')) {
        const lines = content.split('\n');
        const subjectLine = lines[0].replace('Subject:', '').trim();
        const body = lines.slice(2).join('\n').trim();
        return { subject: subjectLine, body };
    }
    return { subject: null, body: content };
}

/**
 * Detects and separates quoted email content from the main message.
 */
function parseQuotedContent(body: string): { mainContent: string; quotedContent: string | null } {
    const quoteStartPatterns = [
        /^On .+ wrote:$/m,
        /^-{3,}\s*Original Message\s*-{3,}$/mi,
        /^From:.+\nSent:.+\nTo:.+/m,
        /^_{3,}$/m,
    ];

    let splitIndex = -1;

    for (const pattern of quoteStartPatterns) {
        const match = body.match(pattern);
        if (match && match.index !== undefined) {
            if (splitIndex === -1 || match.index < splitIndex) {
                splitIndex = match.index;
            }
        }
    }

    const lines = body.split('\n');
    let consecutiveQuotedLines = 0;
    let firstQuoteIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('>')) {
            consecutiveQuotedLines++;
            if (firstQuoteIndex === -1) firstQuoteIndex = i;
        } else {
            if (consecutiveQuotedLines >= 2 && firstQuoteIndex !== -1) {
                const charIndex = lines.slice(0, firstQuoteIndex).join('\n').length;
                if (splitIndex === -1 || charIndex < splitIndex) {
                    splitIndex = charIndex;
                }
            }
            consecutiveQuotedLines = 0;
            firstQuoteIndex = -1;
        }
    }

    if (splitIndex > 0) {
        return {
            mainContent: body.slice(0, splitIndex).trim(),
            quotedContent: body.slice(splitIndex).trim()
        };
    }

    return { mainContent: body, quotedContent: null };
}

/**
 * Extracts attachment info from message content.
 */
function extractAttachments(content: string): { type: 'image' | 'pdf' | 'document' | 'file'; url: string; filename: string }[] {
    const attachments: { type: 'image' | 'pdf' | 'document' | 'file'; url: string; filename: string }[] = [];

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
        const url = match[1];
        const filename = url.split('/').pop() || 'image';
        attachments.push({ type: 'image', url, filename });
    }

    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    while ((match = linkRegex.exec(content)) !== null) {
        const url = match[1];
        const text = match[2];
        const ext = url.split('.').pop()?.toLowerCase() || '';

        if (['pdf'].includes(ext)) {
            attachments.push({ type: 'pdf', url, filename: text || url.split('/').pop() || 'document.pdf' });
        } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
            attachments.push({ type: 'document', url, filename: text || url.split('/').pop() || 'document' });
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            attachments.push({ type: 'image', url, filename: text || url.split('/').pop() || 'image' });
        }
    }

    return attachments;
}

function AttachmentIcon({ type }: { type: 'image' | 'pdf' | 'document' | 'file' }) {
    switch (type) {
        case 'image':
            return <ImageIcon size={16} />;
        case 'pdf':
            return <FileText size={16} className="text-red-500" />;
        case 'document':
            return <FileText size={16} className="text-blue-500" />;
        default:
            return <File size={16} />;
    }
}

/**
 * MessageBubble component - Traditional email reader format
 */
export const MessageBubble = memo(function MessageBubble({
    message,
    recipientName,
    recipientEmail,
    onImageClick,
    onQuoteReply,
    onReactionToggle
}: MessageBubbleProps) {
    const [showQuoted, setShowQuoted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { user } = useAuth();

    const isMe = message.senderType === 'AGENT';
    const isSystem = message.senderType === 'SYSTEM';

    const { subject, body } = useMemo(() => parseEmailContent(message.content), [message.content]);
    const { mainContent, quotedContent } = useMemo(() => parseQuotedContent(body), [body]);
    const attachments = useMemo(() => extractAttachments(body), [body]);
    const isHtmlContent = useMemo(() => /<[a-z][\s\S]*>/i.test(mainContent), [mainContent]);

    const sanitizedContent = useMemo(() => {
        return DOMPurify.sanitize(mainContent, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'div', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'style', 'class'],
            ALLOW_DATA_ATTR: false,
        });
    }, [mainContent]);

    const sanitizedQuotedContent = useMemo(() => {
        if (!quotedContent) return null;
        return DOMPurify.sanitize(quotedContent, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'div', 'span'],
            ALLOWED_ATTR: ['href', 'target'],
        });
    }, [quotedContent]);

    const handleContentClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' && onImageClick) {
            e.preventDefault();
            onImageClick((target as HTMLImageElement).src);
        }
    };

    // System messages - centered pill
    if (isSystem) {
        return (
            <div className="flex justify-center my-4">
                <span className="text-gray-500 text-xs italic bg-gray-100 px-4 py-1.5 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }

    const senderName = isMe ? (user?.fullName || 'You') : (recipientName || 'Customer');

    return (
        <div
            className={cn(
                "mb-3 transition-colors group",
                isMe ? "flex justify-end" : "flex justify-start"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Chat-style layout */}
            <div className={cn(
                "flex gap-2 max-w-[85%]",
                isMe ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <GravatarAvatar
                    email={isMe ? undefined : recipientEmail}
                    name={senderName}
                    size="sm"
                    variant={message.isInternal ? 'amber' : (isMe ? 'blue' : 'gray')}
                    className="self-end"
                />

                {/* Message bubble */}
                <div className="flex flex-col">
                    {/* Internal note badge */}
                    {message.isInternal && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-sm w-fit">
                            🔒 Private Note
                        </span>
                    )}

                    {/* Bubble */}
                    <div className={cn(
                        "rounded-2xl px-4 py-2.5 relative",
                        isMe
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md",
                        message.isInternal && "bg-amber-50 border border-amber-200 text-gray-900"
                    )}>
                        {/* Subject line (if present) */}
                        {subject && (
                            <div className={cn(
                                "text-xs font-semibold mb-1.5 pb-1.5 border-b",
                                isMe ? "border-blue-500/30" : "border-gray-200"
                            )}>
                                {subject}
                            </div>
                        )}

                        {/* Message content */}
                        <div
                            className={cn(
                                "text-sm leading-relaxed",
                                !isHtmlContent && "whitespace-pre-wrap",
                                isHtmlContent && cn(
                                    "[&_table]:max-w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:cursor-pointer",
                                    "[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:opacity-80",
                                    isMe
                                        ? "[&_a]:text-blue-100 [&_a]:underline [&_blockquote]:border-blue-400"
                                        : "[&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-gray-400"
                                )
                            )}
                            onClick={handleContentClick}
                            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                        />

                        {/* Quoted content (collapsible) */}
                        {quotedContent && (
                            <div className={cn(
                                "mt-2 pt-2 border-t",
                                isMe ? "border-blue-500/30" : "border-gray-200"
                            )}>
                                <button
                                    onClick={() => setShowQuoted(!showQuoted)}
                                    className={cn(
                                        "flex items-center gap-1 text-xs transition-colors",
                                        isMe ? "text-blue-200 hover:text-white" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {showQuoted ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    <span>{showQuoted ? 'Hide' : 'Show'} quoted</span>
                                </button>
                                {showQuoted && sanitizedQuotedContent && (
                                    <div
                                        className={cn(
                                            "mt-2 pl-3 border-l-2 text-xs italic opacity-80",
                                            isMe ? "border-blue-400" : "border-gray-300"
                                        )}
                                        dangerouslySetInnerHTML={{ __html: sanitizedQuotedContent }}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Attachments (if any) */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {attachments.map((attachment, idx) => (
                                <a
                                    key={idx}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-xs"
                                >
                                    <AttachmentIcon type={attachment.type} />
                                    <span className="text-gray-700 max-w-[100px] truncate">{attachment.filename}</span>
                                    <Download size={10} className="text-gray-400" />
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Timestamp and status row */}
                    <div className={cn(
                        "flex items-center gap-2 mt-1 text-xs text-gray-500",
                        isMe ? "justify-end" : "justify-start"
                    )}>
                        <span>{format(new Date(message.createdAt), 'h:mm a')}</span>

                        {/* Status indicators for sent messages */}
                        {isMe && !message.isInternal && (
                            <span className="flex items-center gap-0.5">
                                {message.status === 'FAILED' ? (
                                    <AlertCircle size={12} className="text-red-500" />
                                ) : message.firstOpenedAt ? (
                                    <Eye size={12} className="text-purple-500" />
                                ) : (
                                    <Check size={12} className="text-green-500" />
                                )}
                            </span>
                        )}

                        {/* Reply button on hover */}
                        {isHovered && onQuoteReply && (
                            <button
                                onClick={() => onQuoteReply(message)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Reply"
                            >
                                <Reply size={12} />
                            </button>
                        )}
                    </div>

                    {/* Reactions (if any) */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className={cn(
                            "flex flex-wrap gap-1 mt-1",
                            isMe ? "justify-end" : "justify-start"
                        )}>
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                                <button
                                    key={emoji}
                                    onClick={() => onReactionToggle?.(message.id, emoji)}
                                    className={cn(
                                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors border",
                                        users.some(u => u.userId === user?.id)
                                            ? "bg-blue-50 border-blue-200 text-blue-700"
                                            : "bg-white border-gray-200 hover:bg-gray-50"
                                    )}
                                    title={users.map(u => u.userName || 'Unknown').join(', ')}
                                >
                                    <span>{emoji}</span>
                                    {users.length > 1 && <span>{users.length}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
