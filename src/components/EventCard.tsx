'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Event } from '@/types';
import { format } from 'date-fns';
import { Calendar, MapPin, User } from 'lucide-react';
import Image from 'next/image';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);

  return (
    <Card className="w-full flex flex-col md:flex-row overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl">
      <div className="relative w-full md:w-1/3 h-48 md:h-auto">
        <Image
          src={event.imageUrl || `https://placehold.co/600x400.png`}
          data-ai-hint="college event"
          alt={event.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="w-full md:w-2/3 flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{event.title}</CardTitle>
          <CardDescription className="break-words">{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{format(eventDate, "MMMM d, yyyy 'at' h:mm a")}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Posted by {event.authorName}</span>
          </div>
          <Badge variant="secondary">
            {format(eventDate, 'MMM d')}
          </Badge>
        </CardFooter>
      </div>
    </Card>
  );
}
