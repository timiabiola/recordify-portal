import React from 'react';
import { Area, AreaChart as RechartsAreaChart } from 'recharts';
import { BaseChart } from './BaseChart';

type AreaChartProps = {
  data: any[];
  dataKey: string;
  fill?: string;
  stroke?: string;
};

export const AreaChart = ({ 
  data, 
  dataKey, 
  fill = "#8884d8", 
  stroke = "#8884d8" 
}: AreaChartProps) => {
  return (
    <BaseChart data={data}>
      <RechartsAreaChart data={data}>
        <Area type="monotone" dataKey={dataKey} fill={fill} stroke={stroke} />
      </RechartsAreaChart>
    </BaseChart>
  );
};