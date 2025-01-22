import { useIsMobile } from "@/hooks/use-mobile";

const RADIAN = Math.PI / 180;

type PieChartLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
};

export const PieChartLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieChartLabelProps) => {
  const isMobile = useIsMobile();
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs sm:text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};