import React, { useState } from 'react';
import { Button, Card, Input, Label } from './ui';
import { Icon } from './icons';
import { useToast } from './Toast';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthProps {
    onAuthSuccess: (user: User) => void;
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

        try {
            if (isLogin) {
                // Login with Supabase
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                if (!data.user) throw new Error('No user returned');

                // Get user profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) throw profileError;

                const user: User = {
                    uid: profile.id,
                    email: profile.email,
                    displayName: profile.display_name,
                    photoURL: profile.photo_url || `https://picsum.photos/seed/${profile.display_name}/100`,
                    subscription: {
                        tier: profile.subscription_tier as any,
                        status: profile.subscription_status as any,
                    },
                };

                addToast(`Welcome back, ${user.displayName}!`, 'success');
                onAuthSuccess(user);
            } else {
                // Sign up with Supabase
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            displayName,
                            photoURL: `https://picsum.photos/seed/${encodeURIComponent(displayName)}/100`,
                        },
                    },
                });

                if (error) throw error;
                if (!data.user) throw new Error('No user returned');

                // Profile is automatically created by database trigger
                // Wait a moment for trigger to complete
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Get user profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    // Profile might not exist yet, create it manually
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert({
                            id: data.user.id,
                            email,
                            display_name: displayName,
                            photo_url: `https://picsum.photos/seed/${encodeURIComponent(displayName)}/100`,
                        })
                        .select()
                        .single();

                    if (createError) throw createError;
                    
                    const user: User = {
                        uid: newProfile.id,
                        email: newProfile.email,
                        displayName: newProfile.display_name,
                        photoURL: newProfile.photo_url || `https://picsum.photos/seed/${newProfile.display_name}/100`,
                        subscription: {
                            tier: newProfile.subscription_tier as any,
                            status: newProfile.subscription_status as any,
                        },
                    };

                    addToast(`Welcome aboard, ${user.displayName}!`, 'success');
                    onAuthSuccess(user);
                } else {
                    const user: User = {
                        uid: profile.id,
                        email: profile.email,
                        displayName: profile.display_name,
                        photoURL: profile.photo_url || `https://picsum.photos/seed/${profile.display_name}/100`,
                        subscription: {
                            tier: profile.subscription_tier as any,
                            status: profile.subscription_status as any,
                        },
                    };

                    addToast(`Welcome aboard, ${user.displayName}!`, 'success');
                    onAuthSuccess(user);
                }
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            const errorMessage = error.message || error.error_description || 'Authentication failed';
            addToast(errorMessage, 'error');
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
