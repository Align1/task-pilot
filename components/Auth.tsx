import React, { useState } from 'react';
import { Button, Card, Input, Label } from './ui';
import { Icon } from './icons';
import { useToast } from './Toast';
import { User } from '../types';

interface AuthProps {
    onAuthSuccess: (data: { token: string, refreshToken: string, expiresIn: number, user: User }) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const url = `/api/auth/${isLogin ? 'login' : 'signup'}`;
        const body = isLogin ? { email, password } : { email, password, displayName };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            addToast(`Welcome ${isLogin ? '' : 'aboard'}, ${data.user.displayName}!`, 'success');
            onAuthSuccess(data);

        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
            <div className="w-full max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up">
                    <Icon name="Rocket" className="w-9 h-9 text-indigo-400" />
                    <span className="font-bold text-4xl text-slate-800 dark:text-slate-100">Task Pilot</span>
                </div>
                <Card className="p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-slate-100 mb-2">
                        {isLogin ? 'Welcome Back!' : 'Create an Account'}
                    </h2>
                    <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
                        {isLogin ? 'Log in to continue your journey.' : 'Start tracking your time today.'}
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    placeholder="Alex Doe"
                                    autoComplete="name"
                                />
                            </div>
                        )}
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="alex@example.com"
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <Icon name={showPassword ? "EyeSlash" : "Eye"} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                        </Button>
                    </form>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-indigo-500 hover:underline ml-1">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </Card>
            </div>
        </div>
    );
};
