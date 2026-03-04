/**
 * Strips HTML tags from a string and returns plain text.
 * Useful for creating excerpts from HTML content.
 */
export const stripHtml = (html: string): string => {
    if (!html) return '';

    // 1. Remove script and style elements
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 2. Replace common block elements with spaces to prevent word sticking
    text = text.replace(/<\/p>|<\/div>|<br\s*\/?>/gi, ' ');

    // 3. Strip all remaining tags
    text = text.replace(/<[^>]+>/g, '');

    // 4. Decode HTML entities
    const entities: { [key: string]: string } = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' '
    };

    text = text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (match) => entities[match]);

    // 5. Cleanup whitespace
    return text.replace(/\s+/g, ' ').trim();
};

/**
 * Creates an excerpt from text, truncating at a maximum length.
 */
export const createExcerpt = (text: string, maxLength: number = 150): string => {
    const plainText = stripHtml(text);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
};
