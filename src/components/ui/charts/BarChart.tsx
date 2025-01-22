import React from 'react';
import { Bar, BarChart as RechartsBarChart } from 'recharts';
import { BaseChart } from './BaseChart';

type BarChartProps = {
  data: any[];
  dataKey: string;
  fill?: string;
};

export const BarChart = ({ data, dataKey, fill = "#8884d8" }: BarChartProps) => {
  return (
    <BaseChart data={data}>
      <RechartsBarChart data={data}>
        <Bar dataKey={dataKey} fill={fill} />
      </RechartsBarChart>
    </BaseChart>
  );
};