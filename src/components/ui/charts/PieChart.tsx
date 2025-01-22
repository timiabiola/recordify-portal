import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

type PieChartProps = {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
};

export const PieChart = ({ data, height = 300 }: PieChartProps) => {
  const isMobile = useIsMobile();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div style={{ width: '100%', height }}>
      <RechartsPieChart width={400} height={height}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={isMobile ? 80 : 100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || COLORS[index % COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </div>
  );
};