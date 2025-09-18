
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Sun, Moon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setErrorMessage('Account is locked. Please try again later.');
      return;
    }

    if (!emailOrUsername || !password) {
      setErrorMessage('Please enter both email/username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('Attempting login with:', { emailOrUsername, password });

      const response = await apiService.loginAdmin({
        email_or_username: emailOrUsername,
        password: password
      });

      console.log('Login response:', response);
      console.log('Login response data:', response.data);
      console.log('Login response keys:', Object.keys(response.data || {}));

      if (response.status === 'Success') {
        // Reset login attempts on successful login
        setLoginAttempts(0);
        setIsLocked(false);
        
        // Extract user data from response (adjust based on your API response structure)
        const userData = {
          admin_id: response.data?.admin_id || 'unknown',
          email: response.data?.email || emailOrUsername,
          username: response.data?.username || emailOrUsername,
          first_name: response.data?.first_name || '',
          last_name: response.data?.last_name || '',
          role: response.data?.role || 'admin'
        };

        // Token is automatically set as cookie by the backend
        console.log('Authentication token set as cookie by backend');

        // Set user in auth context
        login(userData);
        
        toast({
          title: "Login Successful!",
          description: "Welcome back! Redirecting to module selector...",
        });

        // Redirect to module selector instead of dashboard
        router.push('/select-module');
      } else {
        // Handle failed login
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          setErrorMessage('Account locked due to too many failed attempts. Please try again later.');
          // Auto-unlock after 15 minutes
          setTimeout(() => {
            setIsLocked(false);
            setLoginAttempts(0);
            setErrorMessage('');
          }, 15 * 60 * 1000);
        } else {
          setErrorMessage(`Invalid credentials. ${3 - newAttempts} attempts remaining.`);
        }

        toast({
          title: "Login Failed",
          description: response.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setErrorMessage('Account locked due to too many failed attempts. Please try again later.');
        setTimeout(() => {
          setIsLocked(false);
          setLoginAttempts(0);
          setErrorMessage('');
        }, 15 * 60 * 1000);
      } else {
        setErrorMessage(`Login failed. ${3 - newAttempts} attempts remaining.`);
      }

      toast({
        title: "Login Error",
        description: error instanceof Error ? error.message : "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Enter your credentials to access your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your email or username and password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">Email or Username</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="Enter your email or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  disabled={isLoading || isLocked}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isLocked}
                  required
                />
              </div>
              {errorMessage && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {errorMessage}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || isLocked}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : isLocked ? (
                  'Account Locked'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <Link href="#" className="text-primary hover:underline">
                  Forgot Password?
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
