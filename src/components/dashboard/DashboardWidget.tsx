import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart } from '../ui/chart';
import { Table } from '../ui/table';

interface SavedQuery {
  id: string;
  title: string;
  query_text: string;
  results?: any[];
  metadata?: any;
}

interface DashboardWidgetProps {
  type: 'chart' | 'table' | 'pie' | 'line' | 'bar' | 'area';
  query: SavedQuery;
  title: string;
  xAxis?: string;
  yAxis?: string;
  aggregation?: string;
  onRemove?: () => void;
}

export function DashboardWidget({ type: defaultType, query, title, xAxis, yAxis, aggregation, onRemove }: DashboardWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visualConfig, setVisualConfig] = useState<any>(null);

  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        // Get visualization config from query metadata
        if (query.metadata?.visualization) {
          setVisualConfig(query.metadata.visualization);
        }
        
        // Use query results if available
        if (query.results) {
          setData(query.results);
        }
      } catch (error) {
        console.error('Error loading widget data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [query]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!data.length) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }

    // Use visualization config if available, otherwise fallback to default type
    if (visualConfig) {
      return (
        <Chart
          type={visualConfig.type}
          data={data}
          xAxis={visualConfig.xAxis}
          yAxis={visualConfig.yAxis}
          aggregation={visualConfig.aggregation}
          className="w-full h-[300px]"
        />
      );
    }

    // Fallback to default rendering
    switch (defaultType) {
      case 'chart':
        return (
          <Chart
            type="bar"
            data={data}
            className="w-full h-[300px]"
          />
        );
      case 'pie':
        return (
          <Chart
            type="pie"
            data={data}
            className="w-full h-[300px]"
          />
        );
      case 'line':
        return (
          <Chart
            type="line"
            data={data}
            className="w-full h-[300px]"
          />
        );
      case 'table':
        return (
          <Table
            data={data}
            columns={Object.keys(data[0] || {}).map(key => ({
              accessorKey: key,
              header: key
            }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
