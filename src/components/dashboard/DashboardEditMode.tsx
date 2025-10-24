import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, BarChart3, Trash2, GripVertical } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DashboardBlock {
  id: string;
  type: 'query' | 'markdown';
  content: any;
  order: number;
}

interface DashboardEditModeProps {
  blocks: DashboardBlock[];
  onBlocksChange: (blocks: DashboardBlock[]) => void;
}

export function DashboardEditMode({ blocks, onBlocksChange }: DashboardEditModeProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const addMarkdownBlock = () => {
    const newBlock: DashboardBlock = {
      id: `block_${Date.now()}`,
      type: 'markdown',
      content: { text: '# New Section\n\nAdd your markdown content here...' },
      order: blocks.length
    };
    onBlocksChange([...blocks, newBlock]);
  };

  const addQueryBlock = () => {
    const newBlock: DashboardBlock = {
      id: `block_${Date.now()}`,
      type: 'query',
      content: { 
        title: 'New Query',
        sql: 'SELECT * FROM transactions LIMIT 10',
        visualization: 'table'
      },
      order: blocks.length
    };
    onBlocksChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: any) => {
    const updatedBlocks = blocks.map(block =>
      block.id === id ? { ...block, content } : block
    );
    onBlocksChange(updatedBlocks);
  };

  const deleteBlock = (id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    onBlocksChange(updatedBlocks);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedItem);
    const targetIndex = blocks.findIndex(b => b.id === targetId);
    
    const newBlocks = [...blocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);
    
    onBlocksChange(newBlocks.map((block, index) => ({ ...block, order: index })));
    setDraggedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Block Buttons */}
      <div className="flex gap-3 p-4 border-2 border-dashed border-muted rounded-lg">
        <Button
          variant="outline"
          onClick={addQueryBlock}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Add Query
        </Button>
        <Button
          variant="outline"
          onClick={addMarkdownBlock}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Add Text
        </Button>
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.map((block) => (
          <Card
            key={block.id}
            className="relative group"
            draggable
            onDragStart={(e) => handleDragStart(e, block.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, block.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBlock(block.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-3">
                  {block.type === 'markdown' ? (
                    <div className="space-y-2">
                      <Label>Markdown Content</Label>
                      <Textarea
                        value={block.content.text}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        placeholder="Enter markdown content..."
                        className="min-h-[120px] font-mono text-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Query Title</Label>
                        <Input
                          value={block.content.title}
                          onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })}
                          placeholder="Enter query title..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SQL Query</Label>
                        <Textarea
                          value={block.content.sql}
                          onChange={(e) => updateBlock(block.id, { ...block.content, sql: e.target.value })}
                          placeholder="SELECT * FROM..."
                          className="min-h-[100px] font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No blocks added yet. Click the buttons above to get started.</p>
        </div>
      )}
    </div>
  );
}