import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chart } from '@/components/ui/chart';
import { BarChart3, PieChart, LineChart, Table } from 'lucide-react';

interface QueryVisualizerProps {
  data: any[];
  onVisualizationSave?: (config: any) => void;
}

export function QueryVisualizer({ data, onVisualizationSave }: QueryVisualizerProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'table'>('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');

  const columns = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]);
  }, [data]);

  const numericColumns = useMemo(() => {
    if (!data.length) return [];
    return columns.filter(col => typeof data[0][col] === 'number');
  }, [data, columns]);

  const saveVisualization = () => {
    const config = {
      type: chartType,
      xAxis,
      yAxis,
      data
    };
    onVisualizationSave?.(config);
  };

  if (!data.length) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No data to visualize</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Visualization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Chart Type</label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Bar Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center">
                      <PieChart className="w-4 h-4 mr-2" />
                      Pie Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center">
                      <LineChart className="w-4 h-4 mr-2" />
                      Line Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="table">
                    <div className="flex items-center">
                      <Table className="w-4 h-4 mr-2" />
                      Table
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {chartType !== 'table' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">X-Axis</label>
                  <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Y-Axis</label>
                  <Select value={yAxis} onValueChange={setYAxis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <Button onClick={saveVisualization} className="glow-primary">
            Save Visualization
          </Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {chartType === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {columns.map(col => (
                      <th key={col} className="text-left p-2 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {columns.map(col => (
                        <td key={col} className="p-2 text-sm">{String(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Chart
              type={chartType}
              data={data}
              xAxis={xAxis}
              yAxis={yAxis}
              className="w-full h-[400px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}