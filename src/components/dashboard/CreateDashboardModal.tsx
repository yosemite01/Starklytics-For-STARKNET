import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';

interface CreateDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDashboardModal({ open, onOpenChange }: CreateDashboardModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const dashboard = {
        id: `dash_${Date.now()}`,
        name: name.trim(),
        slug: slug || generateSlug(name),
        isPrivate,
        createdAt: new Date().toISOString(),
        queries: [],
        markdown: '',
        userId: 'demo_user'
      };

      localStorage.setItem(`dashboard_${dashboard.id}`, JSON.stringify(dashboard));
      
      onOpenChange(false);
      navigate(`/dashboard/${dashboard.userId}/${dashboard.slug}?id=${dashboard.id}`);
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new dashboard</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dashboard name</Label>
            <Input
              id="name"
              placeholder="My awesome dashboard"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">Custom URL slug</Label>
            <Input
              id="slug"
              placeholder="my-awesome-dashboard"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private">Make private</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!name.trim() || loading}
            >
              {loading ? 'Creating...' : 'Save and open'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}