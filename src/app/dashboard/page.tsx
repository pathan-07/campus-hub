'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Dashboard } from '@/components/Dashboard';
import { Loader } from '@/components/Loader';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <Loader fullScreen size="lg" text="Loading dashboard..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-5xl font-headline text-foreground">
            Events Dashboard
          </h1>
        </div>
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}
