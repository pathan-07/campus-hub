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
import { CategoryBadge } from '@/components/CategoryBadge';
import type { Event } from '@/types';
import { format } from 'date-fns';
import { Calendar, MapPin, User, Map, Users, Loader2, Check, MessageSquare, Ticket, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { registerForEvent, sendTicketByEmail } from '@/lib/events';
import * as QRCode from 'qrcode';
import Link from 'next/link';

interface EventCardProps {
  event: Event;
  withActions?: boolean;
  onGetTicket?: () => void;
  compact?: boolean;
}

export function EventCard({ event, withActions = true, onGetTicket, compact = false }: EventCardProps) {
  const eventDate = new Date(event.date);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const isCollegeEvent = event.type === 'college';
  const isUserAttending = user && isCollegeEvent ? event.attendeeUids?.includes(user.uid) : false;
  const isUserHost = user && isCollegeEvent ? event.authorId === user.uid : false;
  const isPastEvent = eventDate < new Date();

  const handleRsvp = async () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to RSVP for an event.',
        action: <Button onClick={() => router.push('/login')}>Login</Button>,
      });
      return;
    }

    setIsLoading(true);
    try {
      await registerForEvent(event.id, user);
      
      const ticketData = {
        eventId: event.id,
        userId: user.uid,
      };
      const qrDataString = JSON.stringify(ticketData);
      const dataUrl = await QRCode.toDataURL(qrDataString);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `event-ticket-${event.title.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      sendTicketByEmail(user, event, dataUrl);

      toast({
        title: 'Success!',
        description: `You're registered for "${event.title}". Your ticket is downloading.`,
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'There was an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl group">
      {/* Category Banner */}
      <div className="relative h-2 bg-gradient-to-r from-primary/60 to-accent/60" />
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="font-headline text-xl md:text-2xl line-clamp-2 group-hover:text-primary transition-colors">
              {event.title}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <CategoryBadge category={event.category} size="sm" />
            {isCollegeEvent && (
              <Badge variant="secondary" className="text-xs">
                Campus Event
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2 pt-2">{event.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-3 pb-4">
        {/* Date & Time */}
        <div className="flex items-center text-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mr-3">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{format(eventDate, 'EEEE, MMM d')}</p>
            <p className="text-xs text-muted-foreground">{format(eventDate, 'h:mm a')}</p>
          </div>
        </div>
        
        {/* Location */}
        <div className="flex items-center text-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20 mr-3">
            <MapPin className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{event.venue}</p>
            <p className="text-xs text-muted-foreground truncate">{event.location}</p>
          </div>
        </div>
        
        {/* Attendees count - only for college events */}
        {isCollegeEvent && (
          <div className="flex items-center text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted mr-3">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{event.attendees || 0} attending</p>
              {isUserAttending && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ You're registered
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex-col gap-3 pt-0 border-t bg-muted/20">
        {/* Host info */}
        <div className="flex items-center w-full pt-3 text-sm text-muted-foreground">
          <User className="mr-2 h-4 w-4" />
          <span className="truncate">Posted by {event.authorName || 'Unknown host'}</span>
        </div>
        
        {/* Action buttons */}
        {withActions && !isPastEvent && (
          <div className="flex flex-wrap items-center gap-2 w-full">
            <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
              <Link href={`/events/${event.id}`}>
                <MessageSquare className="mr-1.5 h-4 w-4" />
                Details
              </Link>
            </Button>
            
            {event.mapLink && (
              <Button asChild size="sm" variant="outline">
                <a href={event.mapLink} target="_blank" rel="noopener noreferrer">
                  <Map className="mr-1.5 h-4 w-4" />
                  Map
                </a>
              </Button>
            )}

            {isCollegeEvent ? (
              isUserHost ? (
                <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                  <Link href={`/events/${event.id}/participants`}>
                    <Users className="mr-1.5 h-4 w-4" />
                    Participants
                  </Link>
                </Button>
              ) : onGetTicket ? (
                <Button size="sm" onClick={onGetTicket} className="flex-1 sm:flex-none">
                  <Ticket className="mr-1.5 h-4 w-4" />
                  View Ticket
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={isUserAttending ? 'secondary' : 'default'}
                  onClick={handleRsvp}
                  disabled={isLoading || isUserAttending}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : isUserAttending ? (
                    <>
                      <Check className="mr-1.5 h-4 w-4" />
                      Registered
                    </>
                  ) : (
                    <>
                      <Ticket className="mr-1.5 h-4 w-4" />
                      RSVP
                    </>
                  )}
                </Button>
              )
            ) : (
              event.registrationLink && (
                <Button asChild size="sm" className="flex-1 sm:flex-none">
                  <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                    Register
                    <ExternalLink className="ml-1.5 h-4 w-4" />
                  </a>
                </Button>
              )
            )}
          </div>
        )}
        
        {isPastEvent && (
          <div className="w-full text-center py-1">
            <Badge variant="outline" className="text-muted-foreground">
              Event has ended
            </Badge>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
