import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Wallet, 
  User, 
  Moon, 
  Sun,
  Zap,
  Activity,
  Menu
} from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('light');
  };

  const connectWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <header className="glass border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => {
              const sidebar = document.querySelector('[class*="fixed left-0"]');
              sidebar?.classList.toggle('-translate-x-full');
            }}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Network Status */}
          {/* Docs Link */}
          <Link to="/docs" className="hidden md:block">
            <Button variant="outline" size="sm">
              Docs
            </Button>
          </Link>
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-chart-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Mainnet</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hidden md:flex">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-chart-error rounded-full animate-pulse" />
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Wallet Connection */}
          <Button 
            variant={isConnected ? "default" : "outline"}
            onClick={connectWallet}
            className={isConnected ? "glow-primary" : ""}
            size="sm"
          >
            <Wallet className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">{isConnected ? "0x1234...5678" : "Connect"}</span>
          </Button>

          {/* User Menu */}
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}