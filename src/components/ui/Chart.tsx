import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

interface ChartProps {
  type: 'bar' | 'line' | 'pie';
  data: Record<string, any>[];
  xAxis?: string;
  yAxis?: string;
  className?: string;
}

export function Chart({ type, data, xAxis, yAxis, className }: ChartProps) {
  if (!data || data.length === 0 || !xAxis || !yAxis) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Select columns to visualize data
      </div>
    );
  }

  const chartConfig = {
    width: "100%",
    height: 400,
    data,
    margin: { top: 20, right: 30, bottom: 60, left: 60 }
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <RechartsPrimitive.ResponsiveContainer {...chartConfig}>
            <RechartsPrimitive.BarChart data={data}>
              <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
              <RechartsPrimitive.XAxis 
                dataKey={xAxis} 
                label={{ value: xAxis, position: 'bottom', offset: 20 }}
              />
              <RechartsPrimitive.YAxis
                label={{ value: yAxis, angle: -90, position: 'left', offset: 20 }}
              />
              <RechartsPrimitive.Tooltip />
              <RechartsPrimitive.Legend wrapperStyle={{ paddingTop: "20px" }} />
              <RechartsPrimitive.Bar dataKey={yAxis} fill="#8884d8" />
            </RechartsPrimitive.BarChart>
          </RechartsPrimitive.ResponsiveContainer>
        );

      case 'line':
        return (
          <RechartsPrimitive.ResponsiveContainer {...chartConfig}>
            <RechartsPrimitive.LineChart data={data}>
              <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" />
              <RechartsPrimitive.XAxis 
                dataKey={xAxis}
                label={{ value: xAxis, position: 'bottom', offset: 20 }}
              />
              <RechartsPrimitive.YAxis
                label={{ value: yAxis, angle: -90, position: 'left', offset: 20 }}
              />
              <RechartsPrimitive.Tooltip />
              <RechartsPrimitive.Legend wrapperStyle={{ paddingTop: "20px" }} />
              <RechartsPrimitive.Line type="monotone" dataKey={yAxis} stroke="#8884d8" />
            </RechartsPrimitive.LineChart>
          </RechartsPrimitive.ResponsiveContainer>
        );

      case 'pie':
        return (
          <RechartsPrimitive.ResponsiveContainer {...chartConfig}>
            <RechartsPrimitive.PieChart>
              <RechartsPrimitive.Pie
                data={data}
                nameKey={xAxis}
                dataKey={yAxis}
                label
                labelLine
              >
                {data.map((entry, index) => (
                  <RechartsPrimitive.Cell 
                    key={`cell-${index}`}
                    fill={`hsl(${(index * 360) / data.length}, 70%, 50%)`}
                  />
                ))}
              </RechartsPrimitive.Pie>
              <RechartsPrimitive.Tooltip />
              <RechartsPrimitive.Legend wrapperStyle={{ paddingTop: "20px" }} />
            </RechartsPrimitive.PieChart>
          </RechartsPrimitive.ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full min-h-[400px]", className)}>
      {renderChart()}
    </div>
  );
}