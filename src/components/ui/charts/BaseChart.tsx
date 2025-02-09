
import React, { ReactElement } from 'react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ComposedChart
} from 'recharts';

interface BaseChartProps {
  data: any[];
  children: ReactElement;
}

export const BaseChart: React.FC<BaseChartProps> = ({ data, children }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        {children}
      </ComposedChart>
    </ResponsiveContainer>
  );
};
