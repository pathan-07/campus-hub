'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { BookOpenCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleError = (error: any, context: 'user' | 'guest' | 'google') => {
    let title = 'Authentication';
    if (context === 'guest') title = 'Guest Login';
    if (context === 'google') title = 'Google Sign-In';

    if (error.code === 'auth/popup-closed-by-user') {
      toast({
        variant: 'destructive',
        title: `${title} Cancelled`,
        description: 'The sign-in window was closed. Please try again.',
      });
      return;
    }
    
    if (error.code === 'auth/unauthorized-domain') {
      toast({
        variant: 'destructive',
        title: 'Domain Not Authorized',
        description:
          'This domain is not authorized for Google Sign-In. Please check your Supabase project settings.',
      });
      return;
    }

    if (error.code === 'auth/operation-not-allowed') {
      toast({
        variant: 'destructive',
        title: `${title} Disabled`,
        description:
          'This sign-in method is not enabled in the project configuration.',
      });
      return;
    }

    toast({
      variant: 'destructive',
      title: `${title} Error`,
      description: error.message,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      toast({
        title: 'Success',
        description: isLogin
          ? 'Logged in successfully.'
          : 'Signed up successfully.',
      });
      router.push('/');
    } catch (error: any) {
      handleError(error, 'user');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: 'Success',
        description: 'Logged in with Google successfully.',
      });
      router.push('/');
    } catch (error: any) {
      handleError(error, 'google');
    }
  };

  const handleGuestLogin = async () => {
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(payload?.message ?? 'Guest login failed.');
      }

      toast({
        title: 'Welcome back!',
        description: 'Logged in as guest successfully.',
      });
      // Hard navigation ensures the new auth cookies are picked up
      window.location.assign('/');
    } catch (error: any) {
      // Handle error - show toast for any login failure
      handleError(error, 'guest');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 left-8">
         <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <BookOpenCheck className="h-8 w-8" />
            <span className="text-xl font-headline font-bold">Campus Hub</span>
          </Link>
        </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Enter your credentials to access your account.'
              : 'Enter your email and password to sign up.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
             <Button type="submit" className="w-full mt-2">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </CardContent>
        </form>
         
        <div className="px-6 pb-6">
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} type="button">
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.92 1.62-3.15 0-5.73-2.52-5.73-5.65s2.58-5.65 5.73-5.65c1.73 0 2.95.78 3.65 1.45l2.65-2.65C16.55 3.5 14.7 2.5 12.48 2.5c-4.4 0-8.25 3.55-8.25 7.9s3.85 7.9 8.25 7.9c2.35 0 4.25-.8 5.65-2.25 1.45-1.45 2.1-3.6 2.1-6.05 0-.6-.05-1.15-.15-1.7H12.48z"/>
                    </svg>
                    Sign in with Google
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGuestLogin} type="button">
                  Sign in as Guest
                </Button>
            </div>
            

            <Button
              type="button"
              variant="link"
              className="mt-4 w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
        </div>
      </Card>
    </div>
  );
}
