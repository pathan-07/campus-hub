'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEventsForUser } from '@/lib/events';
import type { Event } from '@/types';
import { EventCard } from '@/components/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCodeDialog } from '@/components/QrCodeDialog';
import * as QRCode from 'qrcode';

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      setEvents([]);
      return;
    }

    const fetchMyEvents = async () => {
      try {
        setIsLoading(true);
        const userEvents = await getEventsForUser(user.uid);
        setEvents(userEvents);
      } catch (error) {
        console.error('Failed to fetch my events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMyEvents();
  }, [user, authLoading]);

  const handleGetTicket = async (event: Event) => {
    if (!user) {
      return;
    }

    setSelectedEvent(event);
    setIsDialogOpen(true);
    setQrCodeDataUrl('');

    try {
      const ticketData = {
        eventId: event.id,
        userId: user.uid,
      };
      const qr = await QRCode.toDataURL(JSON.stringify(ticketData));
      setQrCodeDataUrl(qr);
    } catch (error) {
      console.error('Failed to generate ticket QR code:', error);
      setQrCodeDataUrl('');
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedEvent(null);
      setQrCodeDataUrl('');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 font-headline text-3xl font-bold">My Events</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 text-center">
        <h1 className="mb-6 font-headline text-3xl font-bold">My Events</h1>
        <p>Please log in to see the events you are attending.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-headline text-3xl font-bold">My Events</h1>
      {events.length === 0 ? (
        <p>You haven't registered for any events yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onGetTicket={
                event.type === 'college'
                  ? () => {
                      void handleGetTicket(event);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <QrCodeDialog
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        qrCodeDataUrl={qrCodeDataUrl}
        eventName={selectedEvent?.title ?? 'Event'}
      />
    </div>
  );
}
