'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEventsForUser } from '@/lib/events';
import type { Event } from '@/types';
import { EventCard } from '@/components/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCodeDialog } from '@/components/QrCodeDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, History, CalendarX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchMyEvents = async () => {
      try {
        setIsLoading(true);
        // This function now fetches events from 'event_attendees' table
        const userEvents = await getEventsForUser(user.uid);
        setEvents(userEvents);
      } catch (error) {
        console.error('Failed to fetch my events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyEvents();
  }, [user, authLoading]);

  const handleGetTicket = (event: Event) => {
    setSelectedEvent(event);
  };

  // Helper to split events into Upcoming and Past
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const pastEvents = events.filter(e => new Date(e.date) < now);

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
      <div className="bg-muted p-4 rounded-full mb-4">
        <CalendarX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No events found</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{message}</p>
      <Button asChild>
        <Link href="/">Browse Events</Link>
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold mb-2">My Tickets</h1>
          <p className="text-muted-foreground">Manage your RSVPs and access your QR tickets.</p>
        </div>

        {authLoading || isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[350px] w-full rounded-xl" />
            ))}
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your tickets.</p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-8 grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="upcoming" className="gap-2">
                <Ticket className="h-4 w-4" /> Upcoming
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {upcomingEvents.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <History className="h-4 w-4" /> Past
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-6">
              {upcomingEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      // Only show "Get Ticket" for internal college events
                      onGetTicket={
                        event.type === 'college' ? () => handleGetTicket(event) : undefined
                      }
                      // Only show "View Official Site" for external events
                      onShowExternalLink={
                        event.type === 'other' ? event.registrationLink : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="You haven't RSVP'd to any upcoming events yet. Check out the homepage to find something cool!" />
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-6">
              {pastEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80 grayscale-[30%]">
                  {pastEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      // No ticket actions for past events usually
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No past events found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* QR Code Dialog */}
        <QrCodeDialog
          event={selectedEvent}
          user={user}
          open={!!selectedEvent}
          onOpenChange={() => setSelectedEvent(null)}
        />
      </main>

      <Footer />
    </div>
  );
}