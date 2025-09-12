import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { testSupabaseConnection } from '@/utils/testConnection';
import { validateEmail, validatePassword, sanitizeInput } from '@/utils/validation';
import { handleSupabaseError, getUserFriendlyMessage } from '@/utils/errorHandler';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, UserPlus, LogIn, AlertCircle, Trophy, Briefcase } from 'lucide-react';

export default function Auth() {
  const { signUp, signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);

  useEffect(() => {
    testSupabaseConnection().then(setConnectionStatus);
  }, []);

  // Sign in form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'analyst' | 'bounty_creator'>('analyst');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateEmail(signInEmail)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(signInEmail, signInPassword);
      if (error) {
        setError(getUserFriendlyMessage(handleSupabaseError(error)));
      }
    } catch (error: any) {
      setError(getUserFriendlyMessage(handleSupabaseError(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!validateEmail(signUpEmail)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(signUpPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message!);
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(signUpEmail, signUpPassword, {
        full_name: sanitizeInput(fullName),
        username: sanitizeInput(username),
        role,
      });

      if (error) {
        setError(getUserFriendlyMessage(handleSupabaseError(error)));
      }
    } catch (error: any) {
      setError(getUserFriendlyMessage(handleSupabaseError(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Starklytics
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome to Starklytics</h1>
          <p className="text-muted-foreground">
            Join the premier analytics bounty platform for Starknet
          </p>
        </div>

        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {connectionStatus === false && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Unable to connect to Supabase. Check your internet connection.</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <div className="space-y-4 mb-4">
                  <SocialLoginButtons />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full glow-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input
                        id="full-name"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">I want to</Label>
                    <Select value={role} onValueChange={(value: 'analyst' | 'bounty_creator') => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analyst">
                          <div className="flex items-center space-x-2">
                            <Trophy className="w-4 h-4 text-chart-warning" />
                            <div className="text-left">
                              <div className="font-medium">Work on Bounties</div>
                              <div className="text-xs text-muted-foreground">Solve analytics challenges and earn rewards</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="bounty_creator">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4 text-chart-primary" />
                            <div className="text-left">
                              <div className="font-medium">Create Bounties</div>
                              <div className="text-xs text-muted-foreground">Post analytics challenges for the community</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full glow-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}