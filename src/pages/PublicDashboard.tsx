import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, GitFork, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardWidget {
  id: string;
  type: 'visual' | 'markdown';
  content: any;
  position: { x: number; y: number; width: number; height: number };
}

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  isPublished: boolean;
  userId: string;
  createdAt: string;
  widgets: DashboardWidget[];
}

export default function PublicDashboard() {
  const { username, slug } = useParams();
  const [searchParams] = useSearchParams();
  const dashboardId = searchParams.get('id');
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [dashboardId]);

  const loadDashboard = () => {
    try {
      if (!dashboardId) {
        setLoading(false);
        return;
      }

      const stored = localStorage.getItem(`dashboard_${dashboardId}`);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.isPublished) {
          setDashboard({
            ...data,
            widgets: Array.isArray(data.widgets) ? data.widgets : []
          });
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      alert('Dashboard link copied to clipboard!');
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleFork = () => {
    if (!dashboard) return;
    
    const forkedDashboard = {
      ...dashboard,
      id: `dash_${Date.now()}`,
      name: `${dashboard.name} (forked)`,
      slug: `${dashboard.slug}-fork-${Date.now()}`,
      userId: 'demo_user',
      isPublished: false,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`dashboard_${forkedDashboard.id}`, JSON.stringify(forkedDashboard));
    window.location.href = `/dashboard/${forkedDashboard.userId}/${forkedDashboard.slug}?id=${forkedDashboard.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!dashboard || !dashboard.isPublished) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard not found</h2>
            <p className="text-muted-foreground">This dashboard is not published or doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">{dashboard.name}</h1>
            <Badge variant="default" className="text-xs bg-green-500">Published</Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFork}
            >
              <GitFork className="h-4 w-4" />
              Fork
            </Button>
          </div>
        </div>
      </div>
      
      <main className="relative" id="dashboard-content" style={{ minHeight: '600px' }}>
        {dashboard.widgets.length === 0 ? (
          <div className="container mx-auto px-6 py-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Empty Dashboard</h3>
                <p className="text-muted-foreground">This dashboard doesn't have any content yet.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full p-6">
            {dashboard.widgets.map((widget) => (
              <div
                key={widget.id}
                className="absolute"
                style={{
                  left: widget.position.x,
                  top: widget.position.y,
                  width: widget.position.width,
                  height: widget.position.height,
                }}
              >
                <Card className="h-full">
                  {widget.type === 'markdown' ? (
                    <CardContent className="p-4 h-full overflow-auto">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>
                          {widget.content?.text || ''}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  ) : (
                    <>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{widget.content?.title || 'Untitled Visual'}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 h-full">
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                          <div className="text-center">
                            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">{widget.content?.visualType?.toUpperCase() || 'CHART'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}