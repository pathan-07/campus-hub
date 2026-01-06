'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getEventById, getAttendeeCount, registerForEvent, sendTicketByEmail } from '@/lib/events';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getCommentsStream, addComment } from '@/lib/comments';
import type { Event, Comment } from '@/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EventCard } from '@/components/EventCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, ExternalLink, Map, Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { QrCodeDialog } from '@/components/QrCodeDialog';
import * as QRCode from 'qrcode';

function EventComment({ comment }: { comment: Comment }) {
  const commentDate = comment.createdAt;

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.author.photoURL ?? undefined} />
        <AvatarFallback>{comment.author.name?.[0] ?? 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{comment.author.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(commentDate, { addSuffix: true })}
          </p>
        </div>
        <p className="text-sm text-foreground">{comment.text}</p>
      </div>
    </div>
  );
}


export default function EventDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendeeCount, setAttendeeCount] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        try {
          const eventData = await getEventById(eventId);
          if (eventData) {
            setEvent(eventData);
          } else {
            router.push('/'); // Event not found
          }
        } catch (error) {
          console.error('Failed to fetch event:', error);
          router.push('/');
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();

      // Listen for comments
      const unsubscribe = getCommentsStream(eventId, setComments);
      return () => unsubscribe();
    }
  }, [eventId, router]);

  useEffect(() => {
    if (!event) {
      return;
    }

    let active = true;

    const fetchCount = async () => {
      try {
        const count = await getAttendeeCount(event.id);
        if (active) {
          setAttendeeCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch attendee count:', error);
      }
    };

    void fetchCount();

    return () => {
      active = false;
    };
  }, [event]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(eventId, newComment, user);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
       <div className="flex flex-col min-h-screen bg-background">
        <Header />
         <main className="flex-1 container mx-auto p-4 md:p-8">
            <div className="flex flex-col space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="h-6 w-1/2" />
            </div>
         </main>
        <Footer />
       </div>
    );
  }

  if (!event) {
    return null; // or a not found page
  }

  const isCollegeEvent = event.type === 'college';
  const isUserAttending = Boolean(user && event.attendeeUids.includes(user.uid));

  const handleExternalRegisterClick = async () => {
    if (!event || !event.registrationLink) {
      return;
    }

    const supabaseClient = getSupabaseClient();
    void supabaseClient.rpc('increment_event_click', {
      event_uuid: event.id,
    }).then(({ error }) => {
      if (error) {
        console.error('Error logging click:', error);
      }
    });

    window.open(event.registrationLink, '_blank', 'noopener,noreferrer');
  };

  const handleRsvpClick = async () => {
    if (!event) {
      return;
    }

    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to RSVP and access your ticket.',
        action: (
          <Button onClick={() => router.push('/login')} variant="outline">
            Login
          </Button>
        ),
      });
      return;
    }

    if (event.type !== 'college') {
      toast({
        variant: 'destructive',
        title: 'External event',
        description: 'Please use the official registration link for this event.',
      });
      return;
    }

    const alreadyAttending = event.attendeeUids.includes(user.uid);
    setIsRsvpLoading(true);

    try {
      if (!alreadyAttending) {
        await registerForEvent(event.id, user);
      }

      const ticketPayload = JSON.stringify({ eventId: event.id, userId: user.uid });
      const dataUrl = await QRCode.toDataURL(ticketPayload);
      setQrCodeDataUrl(dataUrl);
      setIsQrDialogOpen(true);

      setEvent((previous) => {
        if (!previous) {
          return previous;
        }

        if (previous.attendeeUids.includes(user.uid)) {
          return previous;
        }

        return {
          ...previous,
          attendeeUids: [...previous.attendeeUids, user.uid],
          attendees: previous.attendees + 1,
        };
      });

      if (!alreadyAttending) {
        void sendTicketByEmail(user, event, dataUrl);
        toast({
          title: 'RSVP confirmed',
          description: 'Your QR ticket is ready. Present it at check-in.',
        });
      } else {
        toast({
          title: 'Ticket ready',
          description: 'Here is your ticket again in case you need it.',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'There was an error. Please try again.';
      toast({
        variant: 'destructive',
        title: 'RSVP failed',
        description: message,
      });
    } finally {
      setIsRsvpLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <EventCard event={event} withActions={false} />

        {event.type === 'other' && attendeeCount > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Join {attendeeCount} other students from Campus Hub planning to go!
          </p>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Ticket className="h-5 w-5" />
              {isCollegeEvent ? 'RSVP & Ticket' : 'External Registration'}
            </CardTitle>
            <CardDescription>
              {isCollegeEvent
                ? 'Campus events use QR tickets for entry. RSVP to claim yours.'
                : 'This event is hosted externally. Use the official link to complete your registration.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {isCollegeEvent ? (
                <>
                  {isUserAttending
                    ? 'You are already registered for this event. You can reopen your ticket anytime.'
                    : 'RSVP to earn campus points and receive your QR ticket instantly.'}
                </>
              ) : (
                <>
                  {event.registrationLink
                    ? 'We will send you to the official site in a new tab.'
                    : 'The host has not provided a registration link yet.'}
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {isCollegeEvent ? (
                <Button onClick={handleRsvpClick} disabled={isRsvpLoading}>
                  {isRsvpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    isUserAttending ? 'View Ticket' : 'RSVP & Get Ticket'
                  )}
                </Button>
              ) : (
                event.registrationLink && (
                  <Button onClick={handleExternalRegisterClick} className="flex items-center">
                    Register on Official Site
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                )
              )}
              {event.mapLink && (
                <Button asChild variant="outline">
                  <a href={event.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    View on Maps
                    <Map className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Discussion</CardTitle>
            <CardDescription>Ask questions or share your thoughts about this event.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {comments.map((comment) => (
                <EventComment key={comment.id} comment={comment} />
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground">No comments yet. Be the first to start the discussion!</p>
              )}
            </div>

            {user && (
              <form onSubmit={handleCommentSubmit} className="mt-8 flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL ?? undefined} />
                  <AvatarFallback>{user.displayName?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 grid gap-2">
                    <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={isSubmitting}
                    />
                    <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="w-full sm:w-auto justify-self-end">
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    Post
                    </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
      <QrCodeDialog
        open={isQrDialogOpen}
        onOpenChange={(open) => {
          setIsQrDialogOpen(open);
          if (!open) {
            setQrCodeDataUrl('');
          }
        }}
        qrCodeDataUrl={qrCodeDataUrl}
        eventName={event.title}
      />
    </div>
  );
}
