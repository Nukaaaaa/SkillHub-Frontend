import React from 'react';

interface Skill {
    subject: string;
    value: number; // 0 to 100
}

interface SkillsChartProps {
    data: Skill[];
    size?: number;
}

const SkillsChart: React.FC<SkillsChartProps> = ({ data, size = 300 }) => {
    const center = size / 2;
    const radius = (size / 2) * 0.7;
    const angleStep = (Math.PI * 2) / data.length;

    // Generate points for the background grid (multiple levels)
    const generateGrid = (levels: number) => {
        const gridLines = [];
        for (let l = 1; l <= levels; l++) {
            const currentRadius = (radius / levels) * l;
            const points = data.map((_, i) => {
                const x = center + currentRadius * Math.cos(angleStep * i - Math.PI / 2);
                const y = center + currentRadius * Math.sin(angleStep * i - Math.PI / 2);
                return `${x},${y}`;
            }).join(' ');
            gridLines.push(<polygon key={`grid-${l}`} points={points} fill="none" stroke="var(--border-color)" strokeWidth="1" />);
        }
        return gridLines;
    };

    // Generate axes
    const generateAxes = () => {
        return data.map((skill, i) => {
            const x = center + radius * Math.cos(angleStep * i - Math.PI / 2);
            const y = center + radius * Math.sin(angleStep * i - Math.PI / 2);

            // Label position
            const labelRadius = radius + 25;
            const lx = center + labelRadius * Math.cos(angleStep * i - Math.PI / 2);
            const ly = center + labelRadius * Math.sin(angleStep * i - Math.PI / 2);

            return (
                <g key={`axis-${i}`}>
                    <line x1={center} y1={center} x2={x} y2={y} stroke="var(--border-color)" strokeWidth="1" />
                    <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fill="var(--text-secondary)"
                        style={{ fontWeight: 500 }}
                    >
                        {skill.subject}
                    </text>
                </g>
            );
        });
    };

    // Generate the skill polygon
    const points = data.map((skill, i) => {
        const currentRadius = (radius * skill.value) / 100;
        const x = center + currentRadius * Math.cos(angleStep * i - Math.PI / 2);
        const y = center + currentRadius * Math.sin(angleStep * i - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {generateGrid(5)}
                {generateAxes()}
                <polygon
                    points={points}
                    fill="var(--primary-color)"
                    fillOpacity="0.2"
                    stroke="var(--primary-color)"
                    strokeWidth="2"
                />
                {/* Dots on points */}
                {data.map((skill, i) => {
                    const currentRadius = (radius * skill.value) / 100;
                    const x = center + currentRadius * Math.cos(angleStep * i - Math.PI / 2);
                    const y = center + currentRadius * Math.sin(angleStep * i - Math.PI / 2);
                    return <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="var(--primary-color)" />;
                })}
            </svg>
        </div>
    );
};

export default SkillsChart;
