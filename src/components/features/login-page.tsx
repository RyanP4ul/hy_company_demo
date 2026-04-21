'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Package, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Demo error: show error for "wrong" email format
    if (!email.includes('@') || email.endsWith('@wrong.com')) {
      setError('Invalid email address. Please check your credentials and try again.');
      return;
    }

    try {
      await login(email, password);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex min-h-0 flex-1">
        {/* ─── LEFT PANEL: Image + Overlay (hidden on mobile) ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative hidden lg:flex lg:w-1/2 xl:w-[55%]"
        >
          {/* Background image */}
          <Image
            src="/login-left-panel.webp"
            alt="HyOps warehouse"
            fill
            className="object-cover"
            priority
            sizes="(min-width: 1024px) 55vw, 50vw"
          />

          {/* Gradient overlay — dark from bottom to transparent top */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Bottom-left tagline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-x-0 bottom-0 px-10 pb-12 xl:px-16 xl:pb-16"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
              HyOps
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-white xl:text-4xl">
              Smart Inventory<br />Management
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Streamline your warehouse operations with real-time tracking,
              intelligent analytics, and seamless team collaboration.
            </p>
          </motion.div>

          {/* Decorative floating stat cards */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="absolute right-10 top-10 hidden xl:block"
          >
            <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs text-white/60">Inventory Accuracy</p>
              <p className="mt-1 text-2xl font-bold text-white">99.8%</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.05, duration: 0.5 }}
            className="absolute bottom-32 right-10 hidden xl:block"
          >
            <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs text-white/60">Orders Processed</p>
              <p className="mt-1 text-2xl font-bold text-white">12,847</p>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── RIGHT PANEL: Login Form ─── */}
        <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 xl:w-[45%]">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="w-full max-w-sm"
          >
            {/* Logo */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Package className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">HyOps</h1>
                <p className="text-xs text-muted-foreground">Inventory & Warehouse Platform</p>
              </div>
            </motion.div>

            {/* Welcome text */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your credentials to access your account
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Email field */}
              <motion.div variants={fadeInUp} transition={{ duration: 0.35 }} className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </motion.div>

              {/* Password field */}
              <motion.div variants={fadeInUp} transition={{ duration: 0.35 }} className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </motion.div>

              {/* Remember me + Forgot password */}
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.35 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm font-normal text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </motion.div>

              {/* Login button */}
              <motion.div variants={fadeInUp} transition={{ duration: 0.35 }}>
                <Button
                  type="submit"
                  className="relative h-11 w-full text-sm font-semibold shadow-lg shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="size-4 animate-spin" />
                      Signing in...
                    </motion.span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </motion.div>
            </motion.form>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="my-8 flex items-center gap-3"
            >
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </motion.div>

            {/* Social login placeholders */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex gap-3"
            >
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 text-sm font-medium"
                disabled={isLoading}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 text-sm font-medium"
                disabled={isLoading}
              >
                Microsoft
              </Button>
            </motion.div>
          </motion.div>

          {/* Copyright footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="mt-auto pb-6 pt-10 text-center text-xs text-muted-foreground/70"
          >
            &copy; {new Date().getFullYear()} HyOps. All rights reserved.
          </motion.p>
        </div>
      </main>
    </div>
  );
}
