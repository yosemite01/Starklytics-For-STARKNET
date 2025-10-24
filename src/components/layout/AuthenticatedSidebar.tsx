import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/use-wallet";
import { useQuerySaver } from "@/hooks/useQuerySaver";
import { 
  BarChart3, 
  Database, 
  Layout, 
  Trophy, 
  Wallet, 
  Settings, 
  ChevronLeft,
  Search,
  Home,
  User,
  Plus,
  LogOut,
  FileBarChart,
  Activity,
  Book,
  Compass,
  Library,
  Folder,
  Star,
  Archive,
  ChevronDown,
  ChevronRight
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Discover", href: "/data-explorer", icon: Compass },
  { name: "Query Editor", href: "/query", icon: Database },
  { name: "Dashboard Builder", href: "/builder", icon: Layout },
  { name: "Data Visualization", href: "/charts", icon: FileBarChart },
  { name: "Contract Analysis", href: "/contract-events-eda", icon: Activity },
  { name: "Bounties", href: "/bounties", icon: Trophy },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface AuthenticatedSidebarProps {
  className?: string;
}

export function AuthenticatedSidebar({ className }: AuthenticatedSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [folders, setFolders] = useState([
    { id: 1, name: "My Queries", type: "creations", count: 0 },
    { id: 2, name: "Favorites", type: "favorites", count: 0 },
    { id: 3, name: "Archived", type: "archived", count: 0 }
  ]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { connectWallet, isConnected, walletAddress, detectWallets } = useWallet();
  const { savedQueries } = useQuerySaver();

  useEffect(() => {
    const favorites = savedQueries.filter(q => q.isFavorite).length;
    const archived = savedQueries.filter(q => q.isArchived).length;
    const myQueries = savedQueries.filter(q => !q.isArchived).length;
    
    setFolders([
      { id: 1, name: "My Queries", type: "creations", count: myQueries },
      { id: 2, name: "Favorites", type: "favorites", count: favorites },
      { id: 3, name: "Archived", type: "archived", count: archived }
    ]);
  }, [savedQueries]);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleWalletClick = async () => {
    if (isConnected) {
      navigate('/wallet');
      return;
    }

    try {
      const detectedWallets = detectWallets();
      if (detectedWallets.argent) {
        await connectWallet('argent');
      } else if (detectedWallets.ready) {
        await connectWallet('ready');
      } else {
        // If no wallet is detected, still navigate to wallet page where they can see installation options
        navigate('/wallet');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      navigate('/wallet');
    }
  };

  return (
    <div
      className={cn(
        "flex-shrink-0 h-screen bg-card/95 backdrop-blur-sm border-r border-border text-card-foreground transition-all duration-300 shadow-lg sticky top-0",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-accent/5">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Starklytics
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-accent/10"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground hover:shadow-md"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Library Section */}
          {!collapsed && (
            <div className="pt-4">
              <div className="px-3 py-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Library
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => setLibraryExpanded(!libraryExpanded)}
                >
                  {libraryExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </Button>
              </div>
              
              {libraryExpanded && (
                <div className="space-y-1">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground cursor-pointer transition-all duration-200"
                      onClick={() => navigate(`/library/${folder.type}`)}
                    >
                      <div className="flex items-center space-x-2">
                        {folder.type === 'favorites' ? (
                          <Star className="w-4 h-4" />
                        ) : folder.type === 'archived' ? (
                          <Archive className="w-4 h-4" />
                        ) : (
                          <Folder className="w-4 h-4" />
                        )}
                        <span>{folder.name}</span>
                      </div>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {folder.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {!collapsed && (
            <div className="pt-4">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Create
                </p>
              </div>
              <div className="space-y-1">
                <Link
                  to="/queries/new"
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground hover:shadow-md"
                >
                  <Plus className="w-5 h-5 transition-colors text-muted-foreground group-hover:text-primary" />
                  <span>New Query</span>
                </Link>
                <Link
                  to="/create-bounty"
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground hover:shadow-md"
                >
                  <Trophy className="w-5 h-5 transition-colors text-muted-foreground group-hover:text-primary" />
                  <span>Create Bounty</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 bg-gradient-to-r from-primary/5 to-accent/5 space-y-3">
          {!collapsed && (
            <div className="space-y-2">
              {profile && (
                <div className="flex items-center space-x-3 px-3 py-2.5 cursor-pointer hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 rounded-xl transition-all duration-200 hover:shadow-md" onClick={handleProfileClick}>
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg ring-2 ring-primary/20">
                    <span className="text-xs font-semibold text-primary-foreground">
                      {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile.full_name || profile.username || 'Analytics User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWalletClick}
                  className="flex-1 justify-start hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-200"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnected ? 'Wallet' : 'Connect'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex-1 justify-start border-border/50 hover:bg-gradient-to-r hover:from-destructive/10 hover:to-destructive/5 hover:border-destructive/30 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}