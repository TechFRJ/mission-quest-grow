import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { ATTRIBUTES, AttributeKey } from '@/lib/attributes';

interface AttributeData {
  [key: string]: number;
}

interface AttributeRadarChartProps {
  current: AttributeData;
  previous?: AttributeData;
  maxValue?: number;
}

export function AttributeRadarChart({ current, previous, maxValue = 100 }: AttributeRadarChartProps) {
  const data = useMemo(() => {
    return ATTRIBUTES.map(attr => ({
      attribute: attr.label,
      icon: attr.icon,
      current: Math.min(current[attr.key] || 0, maxValue),
      ...(previous ? { previous: Math.min(previous[attr.key] || 0, maxValue) } : {}),
    }));
  }, [current, previous, maxValue]);

  // Find weakest attribute
  const weakest = useMemo(() => {
    let min = Infinity;
    let minKey = '';
    ATTRIBUTES.forEach(attr => {
      const val = current[attr.key] || 0;
      if (val < min) { min = val; minKey = attr.key; }
    });
    return minKey;
  }, [current]);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="attribute"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
            tickCount={5}
          />
          {previous && (
            <Radar
              name="Mês anterior"
              dataKey="previous"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          <Radar
            name="Atual"
            dataKey="current"
            stroke="hsl(var(--exp))"
            fill="hsl(var(--exp))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          {previous && <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />}
        </RadarChart>
      </ResponsiveContainer>

      {/* Weak point suggestion */}
      {weakest && (
        <div className="mt-2 px-3 py-2 bg-secondary rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">
              {ATTRIBUTES.find(a => a.key === weakest)?.icon}{' '}
              {ATTRIBUTES.find(a => a.key === weakest)?.label}
            </span>
            {' '}é seu ponto mais fraco. Crie missões nessa área para equilibrar seus stats!
          </p>
        </div>
      )}
    </div>
  );
}
