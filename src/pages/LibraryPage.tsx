import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Archive, Folder, Play, Trash2, Calendar } from "lucide-react";

interface LibraryItem {
  id: string;
  name: string;
  type: 'query' | 'dashboard' | 'visualization';
  query?: string;
  createdAt: string;
  lastRun?: string;
  isFavorite?: boolean;
}

const mockLibraryItems: Record<string, LibraryItem[]> = {
  creations: [
    {
      id: '1',
      name: 'DeFi TVL Analysis',
      type: 'query',
      query: 'SELECT protocol, SUM(tvl_usd) FROM defi_protocols GROUP BY protocol',
      createdAt: '2025-01-15',
      lastRun: '2025-01-20'
    },
    {
      id: '2', 
      name: 'Transaction Volume Dashboard',
      type: 'dashboard',
      createdAt: '2025-01-18'
    }
  ],
  favorites: [
    {
      id: '3',
      name: 'Top Traders Query',
      type: 'query',
      query: 'SELECT from_address, COUNT(*) FROM transactions GROUP BY from_address',
      createdAt: '2025-01-10',
      lastRun: '2025-01-19',
      isFavorite: true
    }
  ],
  archived: [
    {
      id: '4',
      name: 'Old Price Analysis',
      type: 'query',
      query: 'SELECT * FROM historical_prices WHERE date < "2024-01-01"',
      createdAt: '2024-12-01'
    }
  ]
};

export default function LibraryPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    if (type && mockLibraryItems[type]) {
      setItems(mockLibraryItems[type]);
    }
  }, [type]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.query && item.query.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getIcon = () => {
    switch (type) {
      case 'favorites': return Star;
      case 'archived': return Archive;
      default: return Folder;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'favorites': return 'Favorites';
      case 'archived': return 'Archived';
      default: return 'My Queries';
    }
  };

  const IconComponent = getIcon();

  const runQuery = (item: LibraryItem) => {
    if (item.query) {
      localStorage.setItem('loadQuery', item.query);
      navigate('/query');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconComponent className="w-6 h-6" />
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <span className="text-sm text-muted-foreground">({filteredItems.length} items)</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search your library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <span className="px-2 py-1 bg-muted rounded text-xs capitalize">
                    {item.type}
                  </span>
                  {item.isFavorite && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                </div>
                <div className="flex gap-2">
                  {item.query && (
                    <Button size="sm" onClick={() => runQuery(item)}>
                      <Play className="w-4 h-4 mr-1" />
                      Run
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.query && (
                <div className="mb-3">
                  <code className="text-sm bg-muted p-2 rounded block font-mono">
                    {item.query.length > 100 ? `${item.query.substring(0, 100)}...` : item.query}
                  </code>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created {item.createdAt}
                </div>
                {item.lastRun && (
                  <div className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    Last run {item.lastRun}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <IconComponent className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No items found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms' : `Your ${getTitle().toLowerCase()} folder is empty`}
          </p>
        </div>
      )}
    </div>
  );
}