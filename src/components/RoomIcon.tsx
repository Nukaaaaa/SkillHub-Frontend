import React from 'react';
import { Code, Cpu } from 'lucide-react';

interface RoomIconProps {
    name: string;
    tags?: string[];
    size?: number;
    className?: string;
}

export const RoomIcon: React.FC<RoomIconProps> = ({ name, tags = [], size = 40, className = '' }) => {
    // 1. Check for explicit icon tag: e.g. "icon:react"
    let iconKey = '';
    const explicitIconTag = tags.find(t => t.startsWith('icon:'));
    if (explicitIconTag) {
        iconKey = explicitIconTag.replace('icon:', '').toLowerCase();
    } else {
        // 2. Perform fuzzy match by name
        const n = name.toLowerCase();
        if (n.includes('react')) iconKey = 'react';
        else if (n.includes('python') || n.includes('django') || n.includes('fastapi')) iconKey = 'python';
        else if (n.includes('postgres') || n.includes('sql') || n.includes('db')) iconKey = 'postgres';
        else if (n.includes('typescript') || n.includes('ts')) iconKey = 'typescript';
        else if (n.includes('javascript') || n.includes('js')) iconKey = 'javascript';
        else if (n.includes('node')) iconKey = 'node';
        else if (n.includes('docker')) iconKey = 'docker';
        else if (n.includes('java') && !n.includes('javascript')) iconKey = 'java';
        else if (n.includes('go') || n.includes('golang')) iconKey = 'go';
        else if (n.includes('vue')) iconKey = 'vue';
        else if (n.includes('angular')) iconKey = 'angular';
        else if (n.includes('html') || n.includes('css')) iconKey = 'htmlcss';
        else if (n.includes('git')) iconKey = 'git';
        else if (n.includes('linux')) iconKey = 'linux';
        else if (n.includes('robot') || n.includes('bot') || n.includes('hardware')) iconKey = 'robot';
        else if (n.includes('ai') || n.includes('ml') || n.includes('нейро')) iconKey = 'ai';
        else {
            // 3. Perform fuzzy match by other tags
            for (const tag of tags) {
                const t = tag.toLowerCase();
                if (t.includes('react')) { iconKey = 'react'; break; }
                if (t.includes('python') || t.includes('django')) { iconKey = 'python'; break; }
                if (t.includes('postgres') || t.includes('sql')) { iconKey = 'postgres'; break; }
                if (t.includes('ts') || t.includes('typescript')) { iconKey = 'typescript'; break; }
                if (t.includes('js') || t.includes('javascript')) { iconKey = 'javascript'; break; }
                if (t.includes('node')) { iconKey = 'node'; break; }
                if (t.includes('docker')) { iconKey = 'docker'; break; }
                if (t.includes('java')) { iconKey = 'java'; break; }
                if (t.includes('go') || t.includes('golang')) { iconKey = 'go'; break; }
                if (t.includes('git')) { iconKey = 'git'; break; }
            }
        }
    }

    const containerStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        background: '#f8fafc',
        padding: `${size * 0.15}px`,
        boxSizing: 'border-box' as const
    };

    // Render corresponding high-quality SVGs for stack
    switch (iconKey) {
        case 'react':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '1px solid #a5f3fc' }} className={className}>
                    <svg viewBox="-11.5 -10.23174 23 20.46348" width="100%" height="100%">
                        <circle cx="0" cy="0" r="2.05" fill="#00d8ff"/>
                        <g stroke="#00d8ff" strokeWidth="1" fill="none">
                            <ellipse rx="11" ry="4.2"/>
                            <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
                            <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
                        </g>
                    </svg>
                </div>
            );
        case 'python':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }} className={className}>
                    <svg viewBox="0 0 110 110" width="100%" height="100%">
                        <path d="M 53.64,1.00 C 37.89,1.00 24.31,3.47 18.06,10.06 C 11.24,17.26 12.08,27.14 12.08,36.56 L 12.08,47.56 L 27.69,47.56 L 27.69,42.50 C 27.69,32.22 36.00,23.91 46.28,23.91 L 62.00,23.91 C 72.28,23.91 80.59,32.22 80.59,42.50 L 80.59,57.19 C 80.59,67.47 72.28,75.78 62.00,75.78 L 47.94,75.78 L 47.94,91.38 C 58.74,91.38 80.12,89.50 89.28,81.16 C 97.41,73.76 96.69,63.09 96.69,53.66 C 96.69,37.91 94.22,24.34 87.62,18.09 C 81.03,11.84 70.38,1.00 53.64,1.00 Z" fill="#3776AB"/>
                        <path d="M 56.36,109.00 C 72.11,109.00 85.69,106.53 91.94,99.94 C 98.76,92.74 97.92,82.86 97.92,73.44 L 97.92,62.44 L 82.31,62.44 L 82.31,67.50 C 82.31,77.78 74.00,86.09 63.72,86.09 L 48.00,86.09 C 37.72,86.09 29.41,77.78 29.41,67.50 L 29.41,52.81 C 29.41,42.53 37.72,34.22 48.00,34.22 L 62.06,34.22 L 62.06,18.63 C 51.26,18.63 29.88,20.50 20.72,28.84 C 12.59,36.24 13.31,46.91 13.31,56.34 C 13.31,72.09 15.78,85.66 22.38,91.91 C 28.97,98.16 39.62,109.00 56.36,109.00 Z" fill="#FFD43B"/>
                        <circle cx="34.5" cy="20" r="5" fill="#fff"/>
                        <circle cx="75.5" cy="90" r="5" fill="#fff"/>
                    </svg>
                </div>
            );
        case 'postgres':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }} className={className}>
                    <svg viewBox="0 0 128 128" width="100%" height="100%">
                        <path d="M125.8 45.4c-.4-4.6-2.5-9-5.9-12.2-3.3-3.2-7.8-4.9-12.4-4.8H88.7c-5.7 0-11-2.9-14-7.8-2.6-4.2-7.1-6.8-12.1-6.8H46.1c-8 0-14.5 6.5-14.5 14.5v18.7c0 .4-.3.7-.7.7H21.5c-4.6 0-9 1.9-12.2 5.1-3.2 3.3-5 7.8-5 12.4v17c0 4.6 1.8 9.1 5 12.4 3.2 3.2 7.6 5.1 12.2 5.1h15.9c3.9 0 7.6-1.5 10.3-4.3l11.7-11.7c.3-.3.7-.1.7.3v27c0 8 6.5 14.5 14.5 14.5h20.8c5 0 9.6-2.6 12.2-6.8 3-4.9 8.3-7.8 14-7.8h17.8c4.6 0 9.1-1.8 12.4-5 3.3-3.3 5.1-7.8 5.1-12.4V45.4z" fill="#336791"/>
                        <path d="M96.7 54.3c-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8 3.8 1.7 3.8 3.8-1.7 3.8-3.8 3.8z" fill="#FFF"/>
                    </svg>
                </div>
            );
        case 'typescript':
            return (
                <div style={{ ...containerStyle, background: '#00273f', border: '1px solid #004b76' }} className={className}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#3178c6', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '2px' }}>
                        <span style={{ color: 'white', fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: `${size * 0.35}px`, lineHeight: 1, letterSpacing: '-0.5px', margin: '2px' }}>TS</span>
                    </div>
                </div>
            );
        case 'javascript':
            return (
                <div style={{ ...containerStyle, background: '#383000', border: '1px solid #6b5c00' }} className={className}>
                    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#f7df1e', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '2px' }}>
                        <span style={{ color: '#323330', fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: `${size * 0.35}px`, lineHeight: 1, letterSpacing: '-0.5px', margin: '2px' }}>JS</span>
                    </div>
                </div>
            );
        case 'node':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }} className={className}>
                    <svg viewBox="0 0 128 128" width="100%" height="100%">
                        <path d="M115.4 30.1L68.5 3.1c-2.8-1.6-6.2-1.6-9 0L12.6 30.1c-2.8 1.6-4.5 4.6-4.5 7.8v54.1c0 3.2 1.7 6.2 4.5 7.8l46.9 27.1c2.8 1.6 6.2 1.6 9 0l46.9-27.1c2.8-1.6 4.5-4.6 4.5-7.8V37.9c0-3.2-1.7-6.2-4.5-7.8z" fill="#339933"/>
                        <path d="M64 25v78l39.5-22.8V47.8L64 25z" fill="#66cc33"/>
                        <path d="M64 25L24.5 47.8v42.4L64 103V25z" fill="#43853d"/>
                    </svg>
                </div>
            );
        case 'docker':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }} className={className}>
                    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="#0db7ed">
                        <path d="M13.962 6.075h-2.435v2.438h2.435V6.075zm-3.05 0H8.475v2.438h2.437V6.075zm-3.05 2.437H5.427v2.438h2.437V8.512zm0-2.437H5.427v2.438h2.437V6.075zm-3.05 2.437H2.378v2.438h2.437V8.512zm3.05-4.873H8.475v2.437h2.437V3.639zm3.05 4.873h-2.435v2.438h2.435V8.512zm3.05-2.437h-2.435v2.438h2.435V6.075zm3.05 2.437h-2.435v2.438h2.435V8.512zM2.378 12.15v2.438h20.125a.304.304 0 0 0 .3-.3c.007-.06.012-.12.015-.18a5.5 5.5 0 0 0-4.582-4.86c-.524-.075-1.079-.112-1.637-.112a14.773 14.773 0 0 0-7.854 2.222c-.655.4-1.29.85-1.9 1.343l-.337.284a10.8 10.8 0 0 1-4.13 1.605zM23.993 12.3c-.02-.45-.09-.9-.21-1.336a5.77 5.77 0 0 0-1.89-2.915 7.1 7.1 0 0 0-3.32-1.455 9.07 9.07 0 0 0-1.745-.164 12.18 12.18 0 0 0-2.584.28 17.5 17.5 0 0 0-4.593 1.93l-.43.255a13.3 13.3 0 0 1-5.1 1.98H2.17a2.17 2.17 0 0 0-2.17 2.17c0 3.01 2.212 5.516 5.158 5.922a16.89 16.89 0 0 0 6.64-.176 17.9 17.9 0 0 0 5.867-2.3c.71-.4 1.393-.865 2.05-1.39l.218-.178A5.76 5.76 0 0 0 24 12.783l-.007-.483z"/>
                    </svg>
                </div>
            );
        case 'java':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)', border: '1px solid #ffa8a8' }} className={className}>
                    <svg viewBox="0 0 128 128" width="100%" height="100%">
                        <path d="M84.7 114.7c-5.7 3.3-15.6 5.5-25.2 5.5-25.8 0-35.8-12.2-22.3-21 4.7-3 12.5-5.2 19-5.2 3.1 0 5.4.3 6 .5-13.8-1.5-28.7 1.5-33.8 8.7-4.2 5.8 1.6 13 17 15.3 4.2.6 8.9.8 13.3.8 9.9-.1 20.3-2.1 26-4.6zM96.7 99.8c-11.2 5.2-31.5 7.6-43.9 5.5-12.8-2.2-16.1-8.1-7-12.4 8.6-4.1 23.9-6.9 36.4-6.4 1 .1 1.9.1 2.8.2-1.9-.9-4-1.6-6.4-2.1-13-2.6-33.1.2-42.5 5.8-9.9 5.9-8.4 15 3.3 18.2 5.1 1.4 11.2 2 17.4 2 13-.1 28.5-2.7 39.9-7.9v-2.9zM76.9 83c-1.3.1-2.6.2-3.8.2-11.6.2-26.6-1.5-31.3-7-3-3.5-1-8.3 7.6-11.7 2.8-1.1 6.1-2.1 9.4-2.8-5.3-.2-10.4.7-14.2 2.7-7.9 4.1-9.3 10-3.3 13.9 5.1 3.3 14.5 5.4 24.8 5.4 4 0 7.9-.3 11.5-.7L76.9 83z" fill="#ea2d2e"/>
                        <path d="M86.1 48c.9 5-1.7 11-6.1 14.7-6.2 5.2-15.5 7.3-22.5 5.2 5.2.8 11-.4 15-3.8 5.7-4.8 7.3-11.5 4.5-17.7-.3-.6-.7-1.1-1.1-1.7 4 1.3 7.8 4.2 10.2 8.3zM91.9 22.4c-6.8 10-18.7 18.3-21.6 28.5.5-.3.9-.7 1.4-1 6.2-4.9 14.5-11.7 17.7-18.8 2.6-5.8-.3-11.7-6.8-14.7.7 1.6.9 3.8.9 5.9.1 1.7-.2 3.5-.8 5.1zM58.7 33.3c-2.3 8.3-7.9 14.9-10.7 23.4 3-2.1 5.8-4.7 8.2-7.7 5.1-6.5 8.1-15.3 10-23.7.8-3.7-.4-6.4-3.1-7.8.8.7 1.3 1.9 1.5 3.2.1 1.5-.4 3.1-.9 4.6l-5 8z" fill="#007396"/>
                    </svg>
                </div>
            );
        case 'go':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)', border: '1px solid #80deea' }} className={className}>
                    <svg viewBox="0 0 128 128" width="100%" height="100%">
                        <path d="M123.6 57.3C121.4 41.5 106 36 94.6 36c-9.5 0-20.9 3.6-26.6 13.9-4.8-5.3-12.7-8.3-21.4-8.3-17.1 0-33.8 11.5-38.3 32.5C4 93.6 17.5 107.5 35.8 107.5c11.5 0 21.2-5.7 26-15.2.7.9 1.5 1.7 2.3 2.5 5.8 5.4 13.6 8.2 22 8.2 16.4 0 31.4-11 35.9-30.8 1.4-5.6 2.3-10.5 1.6-14.9zM36.1 98.4c-11.7 0-21.1-10.3-18.1-24 2.6-11.9 12.3-19.8 23.5-19.8 11.8 0 21.1 10.3 18.1 24-2.7 12-12.3 19.8-23.5 19.8zm55 0c-11.7 0-21.1-10.3-18.1-24 2.6-11.9 12.3-19.8 23.5-19.8 11.8 0 21.1 10.3 18.1 24-2.7 12-12.3 19.8-23.5 19.8z" fill="#00AED8"/>
                    </svg>
                </div>
            );
        case 'vue':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #f0fdf4 0%, #f4fbf7 100%)', border: '1px solid #d1fae5' }} className={className}>
                    <svg viewBox="0 0 128 128" width="100%" height="100%">
                        <path d="M78.8 10L64 35.4 49.2 10H10l54 93.5L118 10H78.8z" fill="#41B883"/>
                        <path d="M78.8 10L64 35.4 49.2 10H30.4L64 68.2l33.6-58.2H78.8z" fill="#35495E"/>
                    </svg>
                </div>
            );
        case 'angular':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%)', border: '1px solid #ffe3e3' }} className={className}>
                    <svg viewBox="0 0 128 128" width="100%" height="100%">
                        <path d="M64 5L15.2 22.4l7.4 57.6L64 113l41.4-33 7.4-57.6L64 5z" fill="#DD0031"/>
                        <path d="M64 5v108l41.4-33 7.4-57.6L64 5z" fill="#C3002F"/>
                        <path d="M64 21.5L38.4 79h12.5l5.1-13.3h16l5.1 13.3H89.6L64 21.5zm6.8 34.6H57.2L64 39.2l6.8 16.9z" fill="#FFF"/>
                    </svg>
                </div>
            );
        case 'htmlcss':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #fffbeb 0%, #ffedd5 100%)', border: '1px solid #fed7aa' }} className={className}>
                    <svg viewBox="0 0 24 24" width="100%" height="100%">
                        <path d="M1.5 22L0 2h24l-1.5 20L12 24L1.5 22z" fill="#E44D26"/>
                        <path d="M12 21.8l7.8-2.2L21.2 4H12v17.8z" fill="#F16529"/>
                        <path d="M6 8h12l-.3 3.5H9.2l.3 3.5h8.2L17 19.5l-5 1.5l-5-1.5l-.3-3.5H10l.1 1.2l1.9.5l1.9-.5l.2-2.2H6.3L6 8z" fill="#FFF"/>
                    </svg>
                </div>
            );
        case 'git':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #fff5f2 0%, #ffece6 100%)', border: '1px solid #ffd4c6' }} className={className}>
                    <svg viewBox="0 0 128 128" width="100%" height="100%">
                        <path d="M123.6 57.1L70.9 4.4c-2.4-2.4-6.4-2.4-8.8 0L49.3 17.2l12.7 12.7c2.9-1 6.3-.3 8.6 2 2.4 2.4 3 6 .1 8.8l12.4 12.4c2.8-2.9 6.4-2.3 8.8.1 3.4 3.4 3.4 9 0 12.4-3.4 3.4-9 3.4-12.4 0-2.5-2.5-3-6.1-.2-8.9L66.9 42.3c-2.8 2.8-7.9 2.2-10.3-.2-2.5-2.5-3-6.2-.2-9l-13-13L4.4 62.8c-2.4 2.4-2.4 6.4 0 8.8l52.7 52.7c2.4 2.4 6.4 2.4 8.8 0l57.7-57.7c2.4-2.3 2.4-6.3 0-8.5z" fill="#F05032"/>
                    </svg>
                </div>
            );
        case 'linux':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', border: '1px solid #cbd5e1' }} className={className}>
                    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="#333">
                        <path d="M12 2c-4 0-5.5 3-5.5 5.5c0 1.5.5 2.5 1 3.5c-.5 1-1 2.5-1 4.5c0 4 3 6.5 5.5 6.5s5.5-2.5 5.5-6.5c0-2-.5-3.5-1-4.5c.5-1 1-2 1-3.5C17.5 5 16 2 12 2zm0 2c2.5 0 3.5 2 3.5 3.5c0 .7-.2 1.3-.5 1.8c-.8-.8-2-1.3-3-1.3s-2.2.5-3 1.3c-.3-.5-.5-1.1-.5-1.8C8.5 6 9.5 4 12 4zm0 14.5c-1.5 0-3-1-3-3s1.5-3.5 3-3.5s3 1.5 3 3.5s-1.5 3-3 3zm6.5-2.2c-.3.4-.8.7-1.3.7c.3-.5.5-1 .5-1.5c0-.8-.5-1.5-1.2-1.8c.7 1 .7 2.3.2 3.3c-.5.8-1.5 1-2.2.8c.8.5 1 .8.8 1.5c-.2.7-.8 1.2-1.5.8c1.3.7 2 .3 2.5-.7c.4-.9.3-2.1-.2-3.1h.4c.8 0 1.5-.5 1.8-1.2c-.5.3-.8.7-1 .7c.8-.1 1.4.3 1.2 1.1z"/>
                    </svg>
                </div>
            );
        case 'robot':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #cbd5e1' }} className={className}>
                    <Cpu size="100%" color="#475569" strokeWidth={1.5} />
                </div>
            );
        case 'ai':
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: '1px solid #e9d5ff' }} className={className}>
                    <Cpu size="100%" color="#9333ea" strokeWidth={1.5} />
                </div>
            );
        default:
            // Fallback abstract code icon inside violet gradient
            return (
                <div style={{ ...containerStyle, background: 'linear-gradient(135deg, #eeebff 0%, #e0dbff 100%)', border: '1px solid #c7beff' }} className={className}>
                    <Code size="100%" color="#6366f1" strokeWidth={1.5} />
                </div>
            );
    }
};

export default RoomIcon;
