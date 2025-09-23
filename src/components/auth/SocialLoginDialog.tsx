import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface SocialLoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SocialLoginDialog({ open, onClose }: SocialLoginDialogProps) {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    try {
      const email = `${provider}_demo@example.com`;
      const { error } = await signIn(email, 'demo_password');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Login successful",
        description: "You've been signed in via " + provider,
      });

      onClose();
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Social Login</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="justify-start text-base font-normal"
          >
            <img
              src="https://authjs.dev/img/providers/google.svg"
              alt="Google"
              className="mr-2 h-4 w-4"
            />
            Continue with Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('twitter')}
            disabled={loading}
            className="justify-start text-base font-normal"
          >
            <img
              src="https://authjs.dev/img/providers/twitter.svg"
              alt="Twitter"
              className="mr-2 h-4 w-4"
            />
            Continue with Twitter
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogin('email')}
            disabled={loading}
            className="justify-start text-base font-normal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-4 w-4"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Continue with Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}