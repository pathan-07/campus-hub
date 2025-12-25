'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEventsForUser, getEventsCreatedByUser } from '@/lib/events';
import type { Event } from '@/types';
import { EventCard } from '@/components/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from '@/components/Loader';
import { QrCodeDialog } from '@/components/QrCodeDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, History, CalendarX, PlusCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import * as QRCode from 'qrcode';

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchMyEvents = async () => {
      try {
        setIsLoading(true);
        // Fetch events user is attending
        const userEvents = await getEventsForUser(user.uid);
        setEvents(userEvents);
        
        // Fetch events user has created
        const myCreatedEvents = await getEventsCreatedByUser(user.uid);
        setCreatedEvents(myCreatedEvents);
      } catch (error) {
        console.error('Failed to fetch my events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyEvents();
  }, [user, authLoading]);

  const handleGetTicket = async (event: Event) => {
    if (!user) return;
    
    try {
      const ticketPayload = JSON.stringify({ eventId: event.id, userId: user.uid });
      const dataUrl = await QRCode.toDataURL(ticketPayload);
      setQrCodeDataUrl(dataUrl);
      setSelectedEvent(event);
      setIsQrDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  // Helper to split events into Upcoming and Past
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const pastEvents = events.filter(e => new Date(e.date) < now);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">Manage your tickets and events you've created.</p>
        </div>

        {authLoading || isLoading ? (
          <div className="py-12">
            <Loader text="Loading your events..." className="mb-8" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[350px] w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your events.</p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-8 grid w-full max-w-[600px] grid-cols-3">
              <TabsTrigger value="upcoming" className="gap-2">
                <Ticket className="h-4 w-4" /> Tickets
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {upcomingEvents.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="created" className="gap-2">
                <PlusCircle className="h-4 w-4" /> Created
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {createdEvents.length}
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
                      onGetTicket={
                        event.type === 'college' ? () => handleGetTicket(event) : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={CalendarX}
                  title="No upcoming events"
                  description="You haven't RSVP'd to any upcoming events yet. Check out the homepage to find something cool!"
                  actionLabel="Browse Events"
                  actionHref="/"
                />
              )}
            </TabsContent>

            <TabsContent value="created" className="space-y-6">
              {createdEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {createdEvents.map((event) => (
                    <div key={event.id} className="relative">
                      <EventCard event={event} />
                      <div className="absolute top-3 right-3 z-10">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/events/${event.id}/participants`} className="gap-1">
                            <Users className="h-4 w-4" />
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={PlusCircle}
                  title="No events created"
                  description="You haven't created any events yet. Start by creating your first event!"
                  actionLabel="Create Event"
                  actionHref="/"
                />
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-6">
              {pastEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80 grayscale-[30%]">
                  {pastEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      withActions={false}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={History}
                  title="No past events"
                  description="You haven't attended any events yet. Start exploring!"
                  actionLabel="Browse Events"
                  actionHref="/"
                />
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* QR Code Dialog */}
        <QrCodeDialog
          open={isQrDialogOpen}
          onOpenChange={(open) => {
            setIsQrDialogOpen(open);
            if (!open) {
              setSelectedEvent(null);
              setQrCodeDataUrl('');
            }
          }}
          qrCodeDataUrl={qrCodeDataUrl}
          eventName={selectedEvent?.title ?? ''}
          eventDate={selectedEvent?.date}
          eventVenue={selectedEvent?.venue}
          userName={user?.displayName ?? undefined}
        />
      </main>

      <Footer />
    </div>
  );
}