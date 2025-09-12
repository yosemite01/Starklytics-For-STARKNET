import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface AIFloatingButtonProps {
  onClick: () => void;
}

export function AIFloatingButton({ onClick }: AIFloatingButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg z-40 animate-pulse-glow"
      size="icon"
    >
      <MessageCircle className="w-6 h-6" />
    </Button>
  );
}