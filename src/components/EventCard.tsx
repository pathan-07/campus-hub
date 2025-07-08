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
import { Calendar, MapPin, User, Map, Users, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { registerForEvent, sendTicketByEmail } from '@/lib/events';
import * as QRCode from 'qrcode';
import { QrCodeDialog } from './QrCodeDialog';


interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  
  const isCollegeEvent = event.type === 'college';
  const isUserAttending = user && isCollegeEvent ? event.attendeeUids?.includes(user.uid) : false;
  const isUserHost = user && isCollegeEvent ? event.authorId === user.uid : false;

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
        userId: user.uid,
        eventId: event.id,
        userName: user.displayName,
        userEmail: user.email,
      };
      const qrDataString = JSON.stringify(ticketData);
      const dataUrl = await QRCode.toDataURL(qrDataString);

      setQrCodeDataUrl(dataUrl);
      
      // Trigger the email sending flow (fire-and-forget)
      sendTicketByEmail(user, event, dataUrl);

      toast({
        title: 'Success!',
        description: `You're registered for "${event.title}". A ticket has been sent to your email.`,
      });

      setIsQrDialogOpen(true);

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
    <>
      <Card className="w-full flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl">
        <div className="w-full flex flex-col">
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
              <MapPin className="mr-2 h-4 w-4 shrink-0" />
              <span>{event.venue}, {event.location}</span>
            </div>
            {isCollegeEvent && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4 shrink-0" />
                <span>{event.attendees || 0} going</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-wrap gap-y-4 justify-between items-center">
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Posted by {event.authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              {event.mapLink && (
                <Button asChild size="sm" variant="outline">
                  <a href={event.mapLink} target="_blank" rel="noopener noreferrer">
                    <Map className="mr-1 h-4 w-4" />
                    Map
                  </a>
                </Button>
              )}

              {isCollegeEvent ? (
                <Button
                  size="sm"
                  variant={isUserAttending ? 'secondary' : 'default'}
                  onClick={handleRsvp}
                  disabled={isLoading || isUserAttending || isUserHost}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isUserHost ? (
                    "You're Hosting"
                  ) : isUserAttending ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      You're Going!
                    </>
                  ) : (
                    "I'm Going!"
                  )}
                </Button>
              ) : (
                 event.registrationLink && (
                    <Button asChild size="sm">
                      <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                        Register
                      </a>
                    </Button>
                  )
              )}
             
              <Badge variant="secondary">
                {format(eventDate, 'MMM d')}
              </Badge>
            </div>
          </CardFooter>
        </div>
      </Card>
      <QrCodeDialog
        open={isQrDialogOpen}
        onOpenChange={setIsQrDialogOpen}
        qrCodeDataUrl={qrCodeDataUrl}
        eventName={event.title}
      />
    </>
  );
}
