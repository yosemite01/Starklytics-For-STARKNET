import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardEditMode } from '@/components/dashboard/DashboardEditMode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

interface DashboardBlock {
  id: string;
  type: 'visual' | 'markdown';
  content: any;
  order: number;
}

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  userId: string;
  createdAt: string;
  blocks: DashboardBlock[];
}

export default function DashboardPage() {
  const { username, slug } = useParams();
  const [searchParams] = useSearchParams();
  const dashboardId = searchParams.get('id');
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = () => {
      if (!dashboardId) {
        setLoading(false);
        return;
      }

      const stored = localStorage.getItem(`dashboard_${dashboardId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setDashboard({
          ...data,
          blocks: data.blocks || []
        });
      }
      setLoading(false);
    };

    loadDashboard();
  }, [dashboardId]);

  const handleSave = () => {
    try {
      if (dashboard) {
        localStorage.setItem(`dashboard_${dashboard.id}`, JSON.stringify(dashboard));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      setIsEditing(false);
    }
  };

  const handleBlocksChange = (blocks: DashboardBlock[]) => {
    if (dashboard) {
      setDashboard({ ...dashboard, blocks });
    }
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

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard not found</h2>
            <p className="text-muted-foreground">The dashboard you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !dashboard.blocks || dashboard.blocks.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        dashboard={dashboard}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onSave={handleSave}
      />
      
      <main className="container mx-auto px-6 py-6" id="dashboard-content">
        {isEditing ? (
          <DashboardEditMode
            blocks={dashboard.blocks}
            onBlocksChange={handleBlocksChange}
          />
        ) : isEmpty ? (
          <DashboardEmptyState onEdit={() => setIsEditing(true)} />
        ) : (
          <div className="space-y-6">
            {dashboard.blocks
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <div key={block.id}>
                  {block.type === 'markdown' ? (
                    <Card>
                      <CardContent className="p-6">
                        <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                          {block.content.text}
                        </ReactMarkdown>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>{block.content.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">{block.content.visualType?.toUpperCase()} Chart</p>
                            <p className="text-xs text-muted-foreground mt-1">Interactive visualization</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}