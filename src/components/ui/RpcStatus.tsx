import { useRpcEndpoint } from '@/hooks/useRpcEndpoint';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { ChainConnection } from 'lucide-react';

export function RpcStatus() {
  const { activeEndpoint, status } = useRpcEndpoint();

  const statusColors = {
    connecting: 'bg-yellow-500/20 text-yellow-500',
    connected: 'bg-green-500/20 text-green-500',
    error: 'bg-red-500/20 text-red-500'
  };

  const statusText = {
    connecting: 'Connecting...',
    connected: 'Connected',
    error: 'Connection Error'
  };

  return (
    <Tooltip content={activeEndpoint || 'Not connected'}>
      <Badge variant="outline" className={`flex items-center gap-2 ${statusColors[status]}`}>
        <ChainConnection className="w-4 h-4" />
        <span>{statusText[status]}</span>
      </Badge>
    </Tooltip>
  );
}