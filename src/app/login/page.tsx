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
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    }
  };

  const handleGuestLogin = async () => {
    const guestEmail = 'guest@example.com';
    const guestPassword = 'password123';

    try {
      // signup also logs the user in
      await signup(guestEmail, guestPassword);
      toast({
        title: 'Welcome!',
        description: 'Created a guest account and logged you in.',
      });
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // If account already exists, just log in
        try {
          await login(guestEmail, guestPassword);
          toast({
            title: 'Welcome back!',
            description: 'Logged in as guest successfully.',
          });
          router.push('/');
        } catch (loginError: any) {
          toast({
            variant: 'destructive',
            title: 'Guest Login Error',
            description: loginError.message,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Guest Signup Error',
          description: error.message,
        });
      }
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
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
            
            <div className="relative my-4 w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGuestLogin} type="button">
              Sign in as Guest
            </Button>

            <Button
              type="button"
              variant="link"
              className="mt-4"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
