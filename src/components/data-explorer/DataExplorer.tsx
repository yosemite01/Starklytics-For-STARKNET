import { useState, useEffect } from "react";
import { Search, Database, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  schema: any;
  type: 'curated' | 'user' | 'chain';
  isFavorite: boolean;
  lastUpdated: string;
}

const categories = [
  { id: 'all', name: 'All Datasets', icon: Database, count: 24 },
  { id: 'starknet', name: 'Starknet Core', icon: Database, count: 8 },
  { id: 'defi', name: 'DeFi Protocols', icon: Database, count: 12 },
  { id: 'nft', name: 'NFT Collections', icon: Database, count: 4 },
  { id: 'user', name: 'User Uploads', icon: Upload, count: 0 }
];

const mockDatasets: Dataset[] = [
  {
    id: '1',
    name: 'starknet.transactions',
    description: 'All Starknet transaction data with block info, gas usage, and status',
    category: 'starknet',
    schema: { columns: ['hash', 'block_number', 'from_address', 'to_address', 'value'] },
    type: 'curated',
    isFavorite: false,
    lastUpdated: '2025-01-20'
  },
  {
    id: '2', 
    name: 'jediswap.trades',
    description: 'JediSwap DEX trading data including swaps, liquidity, and volume',
    category: 'defi',
    schema: { columns: ['tx_hash', 'token_in', 'token_out', 'amount_in', 'amount_out'] },
    type: 'curated',
    isFavorite: true,
    lastUpdated: '2025-01-20'
  }
];

export function DataExplorer() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>(mockDatasets);

  useEffect(() => {
    let filtered = datasets;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredDatasets(filtered);
  }, [selectedCategory, searchQuery, datasets]);

  const toggleFavorite = (datasetId: string) => {
    setDatasets(prev => prev.map(d => 
      d.id === datasetId ? { ...d, isFavorite: !d.isFavorite } : d
    ));
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Categories */}
      <div className="w-1/4 min-w-[200px] border-r border-border/30 p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <category.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Area - Dataset List */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Data Explorer</h2>
              <p className="text-muted-foreground">
                Discover and explore datasets for your analytics
              </p>
            </div>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Upload className="w-4 h-4 mr-2" />
              Upload Dataset
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Dataset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="p-4 border border-border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-primary" />
                    <span className="font-mono text-sm font-medium">{dataset.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(dataset.id);
                    }}
                  >
                    <Star className={`w-4 h-4 ${dataset.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {dataset.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{dataset.type}</span>
                  <span>Updated {dataset.lastUpdated}</span>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {dataset.schema.columns.slice(0, 3).map((col: string) => (
                    <span key={col} className="px-2 py-1 bg-muted rounded text-xs">
                      {col}
                    </span>
                  ))}
                  {dataset.schema.columns.length > 3 && (
                    <span className="px-2 py-1 bg-muted rounded text-xs">
                      +{dataset.schema.columns.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredDatasets.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No datasets found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or browse different categories
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}