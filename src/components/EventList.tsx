'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { getEventsStream } from '@/lib/events';
import type { Event } from '@/types';
import { EventCard } from './EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from '@/components/Loader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { gujaratCities } from '@/lib/locations';

const eventCategories = ['all', 'Tech', 'Sports', 'Music', 'Workshop', 'Social', 'Other'] as const;

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('upcoming');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const handleEventsUpdate = useCallback((newEvents: Event[]) => {
    setEvents(newEvents);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getEventsStream(handleEventsUpdate, (streamError) => {
      console.error('Failed to load events:', streamError);
      setError('We could not load events right now. Please try again later.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleEventsUpdate]);

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

      const categoryMatch =
        categoryFilter === 'all' || event.category === categoryFilter;

      return statusMatch && locationMatch && categoryMatch;
    });
  }, [events, statusFilter, locationFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader text="Loading events..." />
        </div>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-4 p-4 border rounded-xl bg-card">
              <Skeleton className="h-2 w-full rounded-t-xl" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="space-y-3 pt-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-muted/50 rounded-lg border">
        <div className="grid gap-2 flex-1">
          <Label htmlFor="status-filter">Event Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter">
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
            <SelectTrigger id="location-filter">
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
        <div className="grid gap-2 flex-1">
          <Label htmlFor="category-filter">Category</Label>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {eventCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-headline font-semibold mb-2">No Events Found</h2>
          <p className="max-w-md mx-auto">
            There are no events matching your current filters. Try adjusting
            them or check back later!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
