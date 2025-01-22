import React from 'react';
import { Line, LineChart as RechartsLineChart } from 'recharts';
import { BaseChart } from './BaseChart';

type LineChartProps = {
  data: any[];
  dataKey: string;
  stroke?: string;
};

export const LineChart = ({ data, dataKey, stroke = "#8884d8" }: LineChartProps) => {
  return (
    <BaseChart data={data}>
      <RechartsLineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={stroke} />
      </RechartsLineChart>
    </BaseChart>
  );
};