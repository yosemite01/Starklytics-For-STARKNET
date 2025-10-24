import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DraggableWidgetProps {
  widget: {
    id: string;
    type: 'visual' | 'markdown';
    content: any;
    position: { x: number; y: number; width: number; height: number };
  };
  isEditing: boolean;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export function DraggableWidget({ widget, isEditing, onUpdate, onDelete }: DraggableWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - widget.position.x,
      y: e.clientY - widget.position.y
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: widget.position.width,
      height: widget.position.height
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, e.clientX - dragStart.x);
      const newY = Math.max(0, e.clientY - dragStart.y);
      
      onUpdate(widget.id, {
        position: { ...widget.position, x: newX, y: newY }
      });
    } else if (isResizing) {
      const newWidth = Math.max(200, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(150, resizeStart.height + (e.clientY - resizeStart.y));
      
      onUpdate(widget.id, {
        position: { ...widget.position, width: newWidth, height: newHeight }
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Add global mouse event listeners
  if (typeof window !== 'undefined') {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }

  return (
    <div
      ref={widgetRef}
      className={`absolute ${isEditing ? 'cursor-move' : ''} ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.position.width,
        height: widget.position.height,
      }}
    >
      <Card className={`h-full ${isEditing ? 'border-2 border-dashed border-primary' : ''}`}>
        {isEditing && (
          <div className="absolute -top-8 left-0 flex items-center space-x-2 bg-background border rounded px-2 py-1">
            <GripVertical 
              className="h-4 w-4 cursor-move" 
              onMouseDown={handleMouseDown}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(widget.id)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {widget.type === 'markdown' ? (
          <CardContent className="p-4 h-full overflow-auto">
            <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
              {widget.content?.text || '# Empty Text Block\n\nClick edit to add content.'}
            </ReactMarkdown>
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
        
        {isEditing && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          />
        )}
      </Card>
    </div>
  );
}