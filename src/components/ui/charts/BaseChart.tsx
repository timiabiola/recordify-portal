import React from 'react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

type BaseChartProps = {
  children: React.ReactNode;
  data: any[];
  height?: number | string;
};

export const BaseChart = ({ children, data, height = 300 }: BaseChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      {children}
    </ResponsiveContainer>
  );
};