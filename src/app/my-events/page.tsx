'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getEventsForUser, getUpcomingEvents } from '@/lib/events';
import { recommendEvents } from '@/ai/flows/recommend-events';
import type { Event } from '@/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EventCard } from '@/components/EventCard';
import { Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchEvents = async () => {
        setLoading(true);
        const userEvents = await getEventsForUser(user.uid);
        setMyEvents(userEvents);
        setLoading(false);
      };
      fetchEvents();
    }
  }, [user]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (myEvents.length > 0) {
        setRecommendationsLoading(true);
        try {
          const allUpcomingEvents = await getUpcomingEvents();
          
          const plainAttendedEvents = myEvents.map(e => ({ title: e.title, description: e.description, category: e.category }));
          const plainUpcomingEvents = allUpcomingEvents.map(e => ({ id: e.id, title: e.title, description: e.description, category: e.category }));
          
          const recommendationsResult = await recommendEvents({
            attendedEvents: plainAttendedEvents,
            upcomingEvents: plainUpcomingEvents
          });

          // Filter full event objects based on recommended IDs
          const recommendedEventIds = new Set(recommendationsResult.recommendedEventIds);
          const filteredRecommended = allUpcomingEvents.filter(event => recommendedEventIds.has(event.id));
          setRecommendedEvents(filteredRecommended);

        } catch (error) {
          console.error("Failed to fetch recommendations:", error);
        } finally {
          setRecommendationsLoading(false);
        }
      } else {
        setRecommendationsLoading(false);
      }
    };

    if (!loading) { // Only run after initial events have been loaded
        fetchRecommendations();
    }
  }, [myEvents, loading]);


  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-5xl font-headline text-foreground mb-8">
              My Events
            </h1>
             {loading ? (
              <div className="grid gap-8">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
            ) : myEvents.length > 0 ? (
              <div className="grid gap-8">
                {myEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You haven't RSVP'd to any events yet.</p>
            )}
          </div>

          <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Star className="text-primary"/>
                        Recommended For You
                    </CardTitle>
                    <CardDescription>AI-powered suggestions based on your activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    {recommendationsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : recommendedEvents.length > 0 ? (
                        <div className="space-y-4">
                           {recommendedEvents.map(event => (
                               <div key={event.id} className="p-4 border rounded-lg hover:bg-muted/50">
                                   <h3 className="font-bold">{event.title}</h3>
                                   <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                               </div>
                           ))}
                        </div>
                    ) : (
                         <Alert>
                            <AlertTitle>Nothing to recommend yet!</AlertTitle>
                            <AlertDescription>
                                RSVP to a few events, and we'll start generating personalized recommendations for you here.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
