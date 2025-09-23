iimport React, import React, { useState, useEffect } from "react";
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
import { SavedDashboards } from "@/components/dashboard/SavedDashboards";
import { SaveDashboardDialog } from "@/components/dashboard/SaveDashboardDialog";
import { DashboardService } from "@/services/DashboardService";
interface SavedQuery {useEffect } from "react";
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
import { SavedDashboards } from "@/components/dashboard/SavedDashboards";
import { SaveDashboardDialog } from "@/components/dashboard/SaveDashboardDialog";
import { DashboardService } from "@/services/DashboardService";, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
interface SavedQuery {
  id: string;
  title: string;
  description?: string;
  query_text: string;
  results?: any[];
}
import { Plus, BarChart3, PieChart, LineChart, Table, Save, Eye, Grid, Layout, History, Download, List } from "lucide-react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { SaveDashboardDialog } from "@/components/dashboard/SaveDashboardDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardService } from "@/services/DashboardService";
import { v4 as uuidv4 } from 'uuid';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Constants
const RPC_ENDPOINT = import.meta.env.VITE_STARKNET_RPC_URL || "https://starknet-mainnet.reddio.com/rpc/v0_7";

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

const INITIAL_LAYOUT: Layout = {
  lg: [],
  md: [],
  sm: [],
  xs: [],
  xxs: []
};

const widgetTypes = [
  { type: "bar" as WidgetType, name: "Bar Chart", icon: BarChart3 },
  { type: "pie" as WidgetType, name: "Pie Chart", icon: PieChart },
  { type: "line" as WidgetType, name: "Line Chart", icon: LineChart },
  { type: "area" as WidgetType, name: "Area Chart", icon: LineChart },
  { type: "table" as WidgetType, name: "Table", icon: Table },
];

// Types
type BreakPoint = "lg" | "md" | "sm" | "xs" | "xxs";
type WidgetType = "bar" | "pie" | "line" | "table" | "area";

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
  type: 'bar' | 'line' | 'pie' | 'area' | 'table';
  xAxis?: string;
  yAxis?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
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
  const [savedQueries] = useState<SavedQuery[]>([]);
  const [showQueryDialog, setShowQueryDialog] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [showDashboardsDialog, setShowDashboardsDialog] = useState(false);


  const addWidget = (type: WidgetType) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type} Widget`,
      x: 0,
      y: Infinity,
      w: 6,
      h: 4
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

          {/* Widget Palette */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Grid className="w-5 h-5" />
                <span>Widget Palette</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {widgetTypes.map((widget) => (
                  <Button
                    key={widget.type}
                    variant="outline"
                    className="h-20 flex flex-col items-center space-y-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => addWidget(widget.type)}
                  >
                    <widget.icon className="w-6 h-6" />
                    <span className="text-sm">{widget.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Canvas */}
          <Card className="glass border-border min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Dashboard Preview</span>
              </CardTitle>
              <div className="flex space-x-2">
                <SavedDashboards />
                <Button onClick={exportDashboard} variant="outline">
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
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Plus className="w-12 h-12 mb-4 opacity-50" />
                  <p>Add widgets from the palette above to start building your dashboard</p>
                </div>
              ) : (
                <ResponsiveGridLayout
                  className="layout"
                  layouts={dashboardState.layouts}
                  onLayoutChange={onLayoutChange}
                  breakpoints={BREAKPOINTS}
                  cols={COLS}
                  rowHeight={60}
                  isDraggable={true}
                  isResizable={true}
                  margin={[10, 10]}
                >
                  {dashboardState.widgets.map((widget) => (
                    <div key={widget.id} data-grid={{ x: widget.x, y: widget.y, w: widget.w, h: widget.h }}>
                      <Card
                        className={`cursor-pointer transition-all border-2 ${
                          selectedWidgetId === widget.id 
                            ? 'border-primary glow-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedWidgetId(widget.id)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{widget.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                            <div className="bg-muted/50 rounded-lg h-32 flex items-center justify-center">
                              <span className="text-muted-foreground capitalize">
                                {widget.type} Preview
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
                            {selectedWidgetData.savedQuery.results?.[0]?.results &&
                              Object.keys(selectedWidgetData.savedQuery.results[0].results[0] || {}).map((key) => (
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
                            {selectedWidgetData.savedQuery.results?.[0]?.results &&
                              Object.keys(selectedWidgetData.savedQuery.results[0].results[0] || {})
                                .filter(key => {
                                  const value = selectedWidgetData.savedQuery?.results?.[0]?.results[0][key];
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
                  {savedQueries.map((query) => (
                    <Card 
                      key={query.id} 
                      className="p-4 cursor-pointer hover:border-primary"
                      onClick={() => {
                        if (selectedWidgetData) {
                          updateWidget(selectedWidgetData.id, { savedQuery: query });
                          setShowQueryDialog(false);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{query.title}</h4>
                          {query.description && (
                            <p className="text-sm text-muted-foreground">{query.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          Select
                        </Button>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded-md">
                        {query.query_text}
                      </pre>
                    </Card>
                  ))}
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