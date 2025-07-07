'use client';

import { useEffect, useState, useMemo } from 'react';
import { getEventsStream } from '@/lib/events';
import type { Event } from '@/types';
import { EventCard } from './EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { gujaratCities } from '@/lib/locations';

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('upcoming');
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    const unsubscribe = getEventsStream((newEvents) => {
      setEvents(newEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const locations = useMemo(() => {
    return ['all', ...gujaratCities];
  }, []);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.date);

      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'upcoming' && eventDate >= now) ||
        (statusFilter === 'past' && eventDate < now);

      const locationMatch =
        locationFilter === 'all' || event.location === locationFilter;

      return statusMatch && locationMatch;
    });
  }, [events, statusFilter, locationFilter]);

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-6 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-muted/50 rounded-lg border">
        <div className="grid gap-2 flex-1">
          <Label htmlFor="status-filter">Event Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 flex-1">
          <Label htmlFor="location-filter">Location</Label>
          <Select
            value={locationFilter}
            onValueChange={setLocationFilter}
          >
            <SelectTrigger id="location-filter" className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location === 'all' ? 'All Locations' : location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <h2 className="text-2xl font-headline">No Events Found</h2>
          <p>
            There are no events matching your current filters. Try adjusting
            them!
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
