import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BarChart3, PieChart, LineChart, Table, Save, Eye, Grid, Layout, History, Download, List } from "lucide-react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { ProfessionalDashboardWidget } from "@/components/dashboard/ProfessionalDashboardWidget";
import { SaveDashboardDialog } from "@/components/dashboard/SaveDashboardDialog";
import { SavedDashboards } from "@/components/dashboard/SavedDashboards";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardService } from "@/services/DashboardService";

interface SavedQuery {
  id: string;
  title: string;
  description?: string;
  query_text: string;
  results?: any[];
}
import { v4 as uuidv4 } from 'uuid';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Constants
const RPC_ENDPOINT = import.meta.env.VITE_STARKNET_RPC_URL || "https://starknet-mainnet.reddio.com/rpc/v0_7";

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }; // Much larger grid like Dune

const INITIAL_LAYOUT: Layout = {
  lg: [],
  md: [],
  sm: [],
  xs: [],
  xxs: []
};

import { Activity, TrendingUp, Users, DollarSign, Gauge, Zap, Target, Layers } from 'lucide-react';

const widgetTypes = [
  { type: "kpi" as WidgetType, name: "KPI Card", icon: Target, category: "metrics" },
  { type: "gauge" as WidgetType, name: "Gauge", icon: Gauge, category: "metrics" },
  { type: "bar" as WidgetType, name: "Bar Chart", icon: BarChart3, category: "charts" },
  { type: "line" as WidgetType, name: "Line Chart", icon: LineChart, category: "charts" },
  { type: "area" as WidgetType, name: "Area Chart", icon: TrendingUp, category: "charts" },
  { type: "pie" as WidgetType, name: "Pie Chart", icon: PieChart, category: "charts" },
  { type: "table" as WidgetType, name: "Data Table", icon: Table, category: "data" },
  { type: "heatmap" as WidgetType, name: "Heatmap", icon: Layers, category: "advanced" },
];

// Types
type BreakPoint = "lg" | "md" | "sm" | "xs" | "xxs";
type WidgetType = "bar" | "pie" | "line" | "table" | "area" | "kpi" | "gauge" | "heatmap";

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  lg: LayoutItem[];
  md: LayoutItem[];
  sm: LayoutItem[];
  xs: LayoutItem[];
  xxs: LayoutItem[];
}

// Remove duplicate interfaces - use LayoutItem directly

interface VisualizationConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'table' | 'kpi' | 'gauge' | 'heatmap';
  xAxis?: string;
  yAxis?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  dataSource?: 'starknet' | 'query' | 'live';
  refreshInterval?: number;
  filters?: any[];
  theme?: 'default' | 'dark' | 'neon' | 'minimal';
}

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  savedQuery?: SavedQuery;
  visualConfig?: VisualizationConfig;
  x: number;
  y: number;
  w: number;
  h: number;
  data?: any;
}

interface DashboardState {
  layouts: Layout;
  widgets: Widget[];
}

// Helper functions
const ResponsiveGridLayout = WidthProvider(Responsive);

const serializeDashboardState = (state: DashboardState) => ({
  layouts: state.layouts,
  widgets: state.widgets
});

// Main Component
function DashboardBuilder() {
  const navigate = useNavigate();
  const { id: dashboardId } = useParams();
  const { toast } = useToast();
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardDescription, setDashboardDescription] = useState("");
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    layouts: INITIAL_LAYOUT,
    widgets: []
  });
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);

  // Load saved queries, live data, and AI-generated dashboards
  useEffect(() => {
    // Load recent query results
    const queryResults = localStorage.getItem('queryResults');
    const lastQuery = localStorage.getItem('lastQuery');
    if (queryResults && lastQuery) {
      const results = JSON.parse(queryResults);
      const mockQuery: SavedQuery = {
        id: 'recent-query',
        title: 'Recent Query Results',
        query_text: lastQuery,
        results: [{ results }]
      };
      setSavedQueries([mockQuery]);
    }
    
    // Load all saved queries with visualizations
    const savedQueries = JSON.parse(localStorage.getItem('saved_queries') || '[]');
    const formattedQueries: SavedQuery[] = savedQueries.map((sq: any) => ({
      id: sq.id,
      title: sq.name,
      query_text: sq.query,
      results: [{ results: sq.results }],
      visualizations: sq.visualizations
    }));
    
    // Add live Starknet data sources
    const liveDataSources: SavedQuery[] = [
      {
        id: 'starknet-blocks',
        title: 'Latest Blocks',
        query_text: 'SELECT block_number, transaction_count, timestamp FROM starknet_blocks ORDER BY block_number DESC LIMIT 10',
        results: [{ results: generateMockBlockData() }]
      },
      {
        id: 'starknet-transactions',
        title: 'Transaction Volume',
        query_text: 'SELECT DATE(timestamp) as date, COUNT(*) as transactions FROM starknet_transactions GROUP BY DATE(timestamp)',
        results: [{ results: generateMockTxData() }]
      },
      {
        id: 'starknet-users',
        title: 'Active Users',
        query_text: 'SELECT COUNT(DISTINCT sender_address) as active_users FROM starknet_transactions WHERE timestamp > NOW() - INTERVAL 24 HOUR',
        results: [{ results: [{ active_users: Math.floor(Math.random() * 10000) + 5000 }] }]
      }
    ];
    
    setSavedQueries(prev => [...prev, ...formattedQueries, ...liveDataSources]);
    
    // Load AI-generated dashboard if coming from contract/query
    const aiDashboard = localStorage.getItem('ai_generated_dashboard');
    if (aiDashboard) {
      const config = JSON.parse(aiDashboard);
      setDashboardName(config.name);
      setDashboardDescription(config.description);
      
      // Convert AI widgets to dashboard state
      const widgets = config.widgets.map((w: any) => ({
        id: w.id,
        type: w.type,
        title: w.title,
        x: w.position?.x || 0,
        y: w.position?.y || 0,
        w: w.position?.w || 6,
        h: w.position?.h || 4,
        data: w.data,
        visualConfig: { type: w.type, dataSource: 'live' }
      }));
      
      setDashboardState({
        layouts: generateLayoutsFromWidgets(widgets),
        widgets
      });
      
      localStorage.removeItem('ai_generated_dashboard');
    }
  }, []);
  
  const generateLayoutsFromWidgets = (widgets: Widget[]) => {
    const layouts: Layout = { lg: [], md: [], sm: [], xs: [], xxs: [] };
    
    widgets.forEach(widget => {
      const layout = { i: widget.id, x: widget.x, y: widget.y, w: widget.w, h: widget.h };
      layouts.lg.push(layout);
      layouts.md.push({...layout, w: Math.min(layout.w, COLS.md)});
      layouts.sm.push({...layout, w: Math.min(layout.w, COLS.sm)});
      layouts.xs.push({...layout, w: Math.min(layout.w, COLS.xs)});
      layouts.xxs.push({...layout, w: Math.min(layout.w, COLS.xxs)});
    });
    
    return layouts;
  };
  
  const generateMockBlockData = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      name: `Block ${700000 + i}`,
      value: Math.floor(Math.random() * 200) + 50,
      block_number: 700000 + i,
      transaction_count: Math.floor(Math.random() * 200) + 50,
      timestamp: new Date(Date.now() - i * 30000).toISOString()
    }));
  };
  
  const generateMockTxData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      name: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
      value: Math.floor(Math.random() * 5000) + 1000,
      transactions: Math.floor(Math.random() * 5000) + 1000
    }));
  };
  const [showQueryDialog, setShowQueryDialog] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [showDashboardsDialog, setShowDashboardsDialog] = useState(false);


  const addWidget = (type: WidgetType) => {
    // Set appropriate size based on widget type
    const getWidgetSize = (widgetType: WidgetType) => {
      switch (widgetType) {
        case 'kpi': return { w: 3, h: 3 };
        case 'gauge': return { w: 4, h: 4 };
        case 'table': return { w: 8, h: 6 };
        case 'heatmap': return { w: 6, h: 5 };
        default: return { w: 6, h: 4 };
      }
    };
    
    const size = getWidgetSize(type);
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
      x: 0,
      y: Infinity,
      w: size.w,
      h: size.h,
      visualConfig: {
        type,
        dataSource: 'live',
        refreshInterval: 30000,
        theme: 'default'
      }
    };
    
    const layout = {
      i: newWidget.id,
      x: newWidget.x,
      y: newWidget.y,
      w: newWidget.w,
      h: newWidget.h
    };

    setDashboardState(prev => ({
      ...prev,
      layouts: {
        ...prev.layouts,
        lg: [...prev.layouts.lg, layout],
        md: [...prev.layouts.md, {...layout, w: Math.min(layout.w, COLS.md)}],
        sm: [...prev.layouts.sm, {...layout, w: Math.min(layout.w, COLS.sm)}],
        xs: [...prev.layouts.xs, {...layout, w: Math.min(layout.w, COLS.xs)}],
        xxs: [...prev.layouts.xxs, {...layout, w: Math.min(layout.w, COLS.xxs)}],
      },
      widgets: [...prev.widgets, newWidget]
    }));
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setDashboardState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
    }));
  };

  const onLayoutChange = (_: any[], layouts: Layout) => {
    setDashboardState(prev => ({
      ...prev,
      layouts
    }));
  };

  const saveDashboard = () => {
    try {
      if (!dashboardName) {
        toast({
          title: "Error",
          description: "Please enter a dashboard name",
          variant: "destructive",
        });
        return;
      }

      const dashboardConfig = {
        id: dashboardId || `dashboard-${Date.now()}`,
        name: dashboardName,
        description: dashboardDescription,
        layout: dashboardState.layouts,
        widgets: dashboardState.widgets.map(widget => ({
          id: widget.id,
          type: widget.type,
          title: widget.title,
          query: widget.savedQuery?.query_text,
          options: widget.visualConfig,
          data: widget.data
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      DashboardService.saveDashboard(dashboardConfig);

      if (!dashboardId) {
        navigate(`/dashboard/${dashboardConfig.id}`);
      }

      toast({
        title: "Success",
        description: "Dashboard saved successfully",
      });
    } catch (error) {
      console.error("Error saving dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to save dashboard",
        variant: "destructive",
      });
    }
  };

  const loadHistory = () => {
    setShowDashboardsDialog(true);
  };

  // Load dashboard on component mount if ID is provided
  useEffect(() => {
    if (dashboardId) {
      const dashboard = DashboardService.getDashboardById(dashboardId);
      if (dashboard) {
        setDashboardName(dashboard.name);
        if (dashboard.description) {
          setDashboardDescription(dashboard.description);
        }
        // Convert stored dashboard to component state
        setDashboardState({
          layouts: dashboard.layout,
          widgets: dashboard.widgets.map(widget => ({
            id: widget.id,
            type: widget.type as WidgetType,
            title: widget.title,
            savedQuery: widget.query ? {
              id: `query-${widget.id}`,
              title: widget.title,
              query_text: widget.query,
              description: ''
            } : undefined,
            visualConfig: widget.options,
            data: widget.data,
            x: 0,
            y: 0,
            w: 6,
            h: 4
          }))
        });
        toast({
          title: "Dashboard loaded",
          description: "Successfully loaded dashboard"
        });
      } else {
        toast({
          title: "Error",
          description: "Dashboard not found",
          variant: "destructive"
        });
        navigate('/dashboard');
      }
    }
  }, [dashboardId]);

  const exportDashboard = () => {
    try {
      const dashboardData = {
        name: dashboardName,
        description: dashboardDescription,
        layouts: dashboardState.layouts,
        widgets: dashboardState.widgets,
        rpc_endpoint: RPC_ENDPOINT,
      };

      const dataStr = JSON.stringify(dashboardData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportName = `${dashboardName || 'dashboard'}_${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportName);
      linkElement.click();

      toast({
        title: "Success",
        description: "Dashboard exported successfully",
      });
    } catch (error) {
      console.error("Error exporting dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to export dashboard",
        variant: "destructive",
      });
    }
  };

  // Get selected widget for configuration
  const selectedWidgetData = dashboardState.widgets.find(w => w.id === selectedWidgetId);

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="Dashboard Builder" 
          subtitle="Create and customize your analytics dashboards"
        />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Dashboard Settings */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layout className="w-5 h-5" />
                <span>Dashboard Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-name">Dashboard Name</Label>
                  <Input
                    id="dashboard-name"
                    placeholder="Enter dashboard name"
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rpc-endpoint">RPC Endpoint</Label>
                  <Input
                    id="rpc-endpoint"
                    value={RPC_ENDPOINT}
                    disabled
                    className="text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dashboard-description">Description</Label>
                <Textarea
                  id="dashboard-description"
                  placeholder="Describe your dashboard"
                  value={dashboardDescription}
                  onChange={(e) => setDashboardDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Widget Palette */}
          <Card className="glass border-border bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Grid className="w-5 h-5 text-primary" />
                <span>Widget Library</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Widget Categories */}
              <div className="space-y-6">
                {/* KPI & Metrics */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    KPI & Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {widgetTypes.filter(w => w.category === 'metrics').map((widget) => (
                      <Button
                        key={widget.type}
                        variant="outline"
                        className="h-24 flex flex-col items-center space-y-2 hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                        onClick={() => addWidget(widget.type)}
                      >
                        <widget.icon className="w-7 h-7 text-primary" />
                        <span className="text-xs font-medium">{widget.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Charts */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Charts & Visualizations
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {widgetTypes.filter(w => w.category === 'charts').map((widget) => (
                      <Button
                        key={widget.type}
                        variant="outline"
                        className="h-24 flex flex-col items-center space-y-2 hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                        onClick={() => addWidget(widget.type)}
                      >
                        <widget.icon className="w-7 h-7 text-primary" />
                        <span className="text-xs font-medium">{widget.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Data & Advanced */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    Data & Advanced
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {widgetTypes.filter(w => w.category === 'data' || w.category === 'advanced').map((widget) => (
                      <Button
                        key={widget.type}
                        variant="outline"
                        className="h-24 flex flex-col items-center space-y-2 hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                        onClick={() => addWidget(widget.type)}
                      >
                        <widget.icon className="w-7 h-7 text-primary" />
                        <span className="text-xs font-medium">{widget.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Dashboard Canvas */}
          <Card className="glass border-border min-h-[600px] bg-gradient-to-br from-background via-background to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-primary" />
                <span>Live Dashboard Preview</span>
                <div className="flex items-center space-x-2 ml-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Live Data</span>
                </div>
              </CardTitle>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full">
                  <Activity className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">{dashboardState.widgets.length} Widgets</span>
                </div>
                <SavedDashboards />
                <Button onClick={exportDashboard} variant="outline" className="hover:bg-primary/10">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <SaveDashboardDialog onSave={(name, description) => {
                  setDashboardName(name);
                  setDashboardDescription(description);
                  saveDashboard();
                }} />
              </div>
            </CardHeader>
            <CardContent>
              {dashboardState.widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-6">
                      <Plus className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Create Your Analytics Dashboard</h3>
                  <p className="text-center max-w-lg mb-6">Build comprehensive dashboards with live Starknet data, saved queries, and AI-generated insights. Drag and drop widgets to create professional analytics.</p>
                  <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-center">
                      💡 <strong>Pro Tip:</strong> Create dashboards from Contract Analysis or Query Results for instant insights
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Activity className="w-3 h-3" />
                      <span>Real-time Data</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Interactive Charts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Advanced KPIs</span>
                    </div>
                  </div>
                </div>
              ) : (
                <ResponsiveGridLayout
                  className="layout"
                  layouts={dashboardState.layouts}
                  onLayoutChange={onLayoutChange}
                  breakpoints={BREAKPOINTS}
                  cols={COLS}
                  rowHeight={40}
                  containerPadding={[10, 10]}
                  maxRows={50}
                  isDraggable={true}
                  isResizable={true}
                  margin={[10, 10]}
                >
                  {dashboardState.widgets.map((widget) => (
                    <div key={widget.id} data-grid={{ x: widget.x, y: widget.y, w: widget.w, h: widget.h }}>
                      <Card
                        className={`cursor-pointer transition-all duration-300 border-2 glass ${
                          selectedWidgetId === widget.id 
                            ? 'border-primary shadow-lg shadow-primary/20 bg-gradient-to-br from-primary/5 to-accent/5' 
                            : 'border-border/50 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10'
                        }`}
                        onClick={() => setSelectedWidgetId(widget.id)}
                      >
                        <CardHeader className="pb-2 border-b border-border/30">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{widget.title}</span>
                            <div className="flex items-center space-x-1">
                              {widget.visualConfig?.dataSource === 'live' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                              {widgetTypes.find(w => w.type === widget.type)?.icon && (
                                React.createElement(widgetTypes.find(w => w.type === widget.type)!.icon, {
                                  className: "w-4 h-4 text-primary"
                                })
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {widget.savedQuery ? (
                            <DashboardWidget
                              type={widget.visualConfig?.type || widget.type}
                              query={widget.savedQuery}
                              title={widget.title}
                              xAxis={widget.visualConfig?.xAxis}
                              yAxis={widget.visualConfig?.yAxis}
                              aggregation={widget.visualConfig?.aggregation}
                            />
                          ) : (
                            <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg h-32 flex flex-col items-center justify-center border border-dashed border-border">
                              {widgetTypes.find(w => w.type === widget.type)?.icon && (
                                React.createElement(widgetTypes.find(w => w.type === widget.type)!.icon, {
                                  className: "w-8 h-8 text-primary mb-2"
                                })
                              )}
                              <span className="text-muted-foreground capitalize font-medium">
                                {widget.type} Widget
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">
                                Configure data source
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </ResponsiveGridLayout>
              )}
            </CardContent>
          </Card>

          {/* Widget Configuration */}
          {selectedWidgetId && selectedWidgetData && (
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle>Widget Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Widget Title</Label>
                    <Input
                      value={selectedWidgetData.title}
                      onChange={(e) => updateWidget(selectedWidgetData.id, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Widget Type</Label>
                    <Input value={selectedWidgetData.type} disabled className="capitalize" />
                  </div>
                  
                  {/* Query Selection */}
                  <div className="md:col-span-2 space-y-2">
                    <Label>Query</Label>
                    <Card className="p-4">
                      {selectedWidgetData.savedQuery ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{selectedWidgetData.savedQuery.title}</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateWidget(selectedWidgetData.id, { savedQuery: undefined, visualConfig: undefined })}
                            >
                              Change Query
                            </Button>
                          </div>
                          <pre className="text-xs bg-muted p-2 rounded-md">
                            {selectedWidgetData.savedQuery.query_text}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">No query selected</p>
                          <Button 
                            onClick={() => setShowQueryDialog(true)}
                            variant="secondary"
                          >
                            Select a Query
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Visualization Configuration */}
                  {selectedWidgetData.savedQuery && (
                    <>
                      <div className="space-y-2">
                        <Label>Visualization Type</Label>
                        <Select 
                          value={selectedWidgetData.visualConfig?.type || selectedWidgetData.type}
                          onValueChange={(value: any) => 
                            updateWidget(selectedWidgetData.id, {
                              visualConfig: {
                                ...selectedWidgetData.visualConfig,
                                type: value
                              }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {widgetTypes.map((type) => (
                              <SelectItem key={type.type} value={type.type}>
                                <div className="flex items-center">
                                  <type.icon className="w-4 h-4 mr-2" />
                                  {type.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>X-Axis</Label>
                        <Select 
                          value={selectedWidgetData.visualConfig?.xAxis || ""}
                          onValueChange={(value) => 
                            updateWidget(selectedWidgetData.id, {
                              visualConfig: {
                                ...selectedWidgetData.visualConfig,
                                xAxis: value
                              }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select X-Axis" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedWidgetData.savedQuery.results?.[0]?.results?.[0] &&
                              Object.keys(selectedWidgetData.savedQuery.results[0].results[0]).map((key) => (
                                <SelectItem key={key} value={key}>
                                  {key}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Y-Axis</Label>
                        <Select 
                          value={selectedWidgetData.visualConfig?.yAxis || ""}
                          onValueChange={(value) => 
                            updateWidget(selectedWidgetData.id, {
                              visualConfig: {
                                ...selectedWidgetData.visualConfig,
                                yAxis: value
                              }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Y-Axis" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedWidgetData.savedQuery.results?.[0]?.results?.[0] &&
                              Object.keys(selectedWidgetData.savedQuery.results[0].results[0])
                                .filter(key => {
                                  const value = selectedWidgetData.savedQuery?.results?.[0]?.results?.[0]?.[key];
                                  return typeof value === 'number' || !isNaN(Number(value));
                                })
                                .map((key) => (
                                  <SelectItem key={key} value={key}>
                                    {key}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(selectedWidgetData.visualConfig?.type === 'bar' || 
                        selectedWidgetData.visualConfig?.type === 'pie') && (
                        <div className="space-y-2">
                          <Label>Aggregation</Label>
                          <Select 
                            value={selectedWidgetData.visualConfig?.aggregation || "sum"}
                            onValueChange={(value: any) => 
                              updateWidget(selectedWidgetData.id, {
                                visualConfig: {
                                  ...selectedWidgetData.visualConfig,
                                  aggregation: value
                                }
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sum">Sum</SelectItem>
                              <SelectItem value="avg">Average</SelectItem>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="min">Min</SelectItem>
                              <SelectItem value="max">Max</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Query Selection Dialog */}
          <Dialog open={showQueryDialog} onOpenChange={setShowQueryDialog}>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Select a Query</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] w-full pr-4">
                <div className="space-y-4">
                  {savedQueries.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No saved queries available</p>
                      <p className="text-sm text-muted-foreground mt-2">Run a query first to add it to dashboard</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        Select a query to power this widget. All saved visualizations will be available.
                      </div>
                      {savedQueries.map((query) => (
                        <Card 
                          key={query.id} 
                          className="p-4 cursor-pointer hover:border-primary transition-all"
                          onClick={() => {
                            if (selectedWidgetData) {
                              updateWidget(selectedWidgetData.id, { 
                                savedQuery: query,
                                visualConfig: {
                                  ...selectedWidgetData.visualConfig,
                                  dataSource: 'query'
                                }
                              });
                              setShowQueryDialog(false);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{query.title}</h4>
                              {query.description && (
                                <p className="text-sm text-muted-foreground">{query.description}</p>
                              )}
                              {(query as any).visualizations && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(query as any).visualizations.map((viz: any, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {viz.type}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm">
                              Select
                            </Button>
                          </div>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-hidden">
                            {query.query_text.length > 100 ? query.query_text.substring(0, 100) + '...' : query.query_text}
                          </pre>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default DashboardBuilder;