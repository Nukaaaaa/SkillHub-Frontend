import React from 'react';
import { 
    Radar, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis, 
    ResponsiveContainer 
} from 'recharts';

interface Skill {
    subject: string;
    value: number;
    fullMark: number;
}

interface SkillRadarProps {
    data: Skill[];
}

const SkillRadar: React.FC<SkillRadarProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 320, padding: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                    />
                    <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={false} 
                        axisLine={false} 
                    />
                    <Radar
                        name="Навыки"
                        dataKey="value"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fill="#6366f1"
                        fillOpacity={0.4}
                        animationBegin={300}
                        animationDuration={1500}
                        animationEasing="ease-out"
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SkillRadar;
