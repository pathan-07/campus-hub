'use client';

import { useEffect, useState } from 'react';
import { getEventsStream } from '@/lib/events';
import type { Event } from '@/types';
import { EventCard } from './EventCard';
import { Skeleton } from '@/components/ui/skeleton';

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getEventsStream((newEvents) => {
      setEvents(newEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
        {[...Array(3)].map((_, i) => (
           <div key={i} className="flex flex-col md:flex-row space-x-4 p-4 border rounded-lg">
             <Skeleton className="h-48 w-full md:w-1/3 rounded-md" />
             <div className="space-y-4 w-full md:w-2/3 mt-4 md:mt-0">
               <Skeleton className="h-8 w-3/4" />
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-6 w-1/2" />
             </div>
           </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <h2 className="text-2xl font-headline">No Events Found</h2>
        <p>Check back later for new events, or be the first to post one!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
