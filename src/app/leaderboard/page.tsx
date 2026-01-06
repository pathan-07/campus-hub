'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Leaderboard } from '@/components/Leaderboard';
import { Loader } from '@/components/Loader';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <Loader fullScreen size="lg" text="Loading leaderboard..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Trophy className="h-4 w-4" />
            Campus Rankings
          </div>
          <h1 className="text-3xl md:text-5xl font-headline font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            See how you rank against other students. Attend more events to earn points and climb the ranks!
          </p>
        </div>
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
}
