
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Building, MessageSquare, Briefcase, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

export default function SelectModulePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleModuleSelect = (path: string) => {
        router.push(path);
    }

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Still redirect to login even if logout fails
            router.push('/login');
        }
    }

    const modules = [
        {
            title: 'Chatting Agency',
            description: 'Manage chatters, models, and salary reports.',
            icon: <MessageSquare className="h-10 w-10 text-primary" />,
            path: '/dashboard',
            enabled: true,
        },
        {
            title: 'Management Agency',
            description: 'Oversee client relationships and contracts.',
            icon: <Building className="h-10 w-10" />,
            path: '#',
            enabled: false,
        },
        {
            title: 'Future Module',
            description: 'A new vertical for your business.',
            icon: <Briefcase className="h-10 w-10" />,
            path: '#',
            enabled: false,
        }
    ]

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
                <div className="text-center">
                    <Logo />
                    <h1 className="text-3xl font-bold font-headline mt-6">Loading...</h1>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect to login)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            {/* Header with user info and logout */}
            <div className="absolute top-4 right-4 flex items-center gap-4">
                {user && (
                    <div className="text-sm text-muted-foreground">
                        Welcome, {user.first_name} {user.last_name}
                    </div>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>

            <div className="text-center mb-12">
                <Logo />
                <h1 className="text-3xl font-bold font-headline mt-6">Select a Module</h1>
                <p className="text-muted-foreground">Choose which part of the business you want to manage.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {modules.map(module => (
                     <Card 
                        key={module.title}
                        onClick={() => module.enabled && handleModuleSelect(module.path)}
                        className={cn(
                            "text-center p-8 flex flex-col items-center justify-center transition-all duration-300",
                            module.enabled 
                                ? 'cursor-pointer hover:shadow-2xl hover:border-primary/50 hover:-translate-y-2'
                                : 'opacity-50 cursor-not-allowed bg-muted'
                        )}
                     >
                        <div className={cn("mb-6", !module.enabled && 'text-muted-foreground')}>{module.icon}</div>
                        <CardTitle className="font-headline text-2xl">{module.title}</CardTitle>
                        <CardDescription className="mt-2">{module.description}</CardDescription>
                        {!module.enabled && (
                            <div className="text-xs font-bold text-primary mt-4 rounded-full bg-primary/10 px-3 py-1">COMING SOON</div>
                        )}
                     </Card>
                ))}
            </div>
        </div>
    );
}
