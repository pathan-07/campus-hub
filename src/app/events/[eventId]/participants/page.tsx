
'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { getEventStreamById } from '@/lib/events';
import { getUsersByUIDs } from '@/lib/users';
import type { Event, UserProfile } from '@/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Loader2, User, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ParticipantsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const participantIdsRef = useRef<string>('');

  const fetchParticipantProfiles = useCallback(async (uids: string[]) => {
      try {
        const participantProfiles = await getUsersByUIDs(uids);
        setParticipants(participantProfiles);
      } catch (e: any) {
        setError(e.message || 'Failed to load participant data.');
      }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!eventId) {
      setLoading(false);
      setError("Event ID is missing.");
      return;
    };

    const unsubscribe = getEventStreamById(eventId, async (eventData) => {
      if (loading) setLoading(false);
      
      if (!eventData) {
        setError('Event not found.');
        setEvent(null);
        setParticipants([]);
        return;
      }
      
      if (eventData.authorId !== user.uid) {
        setError('You are not authorized to view this page.');
        setEvent(null);
        setParticipants([]);
        return;
      }

      setError(null);
      setEvent(eventData);

      const hasAttendees = eventData.attendeeUids && eventData.attendeeUids.length > 0;
      const remoteParticipantIds = (eventData.attendeeUids || []).sort().join(',');

      if (hasAttendees && (participantIdsRef.current !== remoteParticipantIds)) {
        participantIdsRef.current = remoteParticipantIds;
        fetchParticipantProfiles(eventData.attendeeUids);
      } else if (!hasAttendees) {
        setParticipants([]);
      }
    });

    return () => unsubscribe();
  }, [user, authLoading, eventId, router, fetchParticipantProfiles, loading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {error ? (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : event && (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Participants for "{event.title}"</CardTitle>
              <CardDescription>
                A list of users who have RSVP'd for your event. Total: {participants.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Checked In</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.length > 0 ? participants.map((p) => (
                      <TableRow key={p.uid}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={p.photoURL ?? undefined} />
                              <AvatarFallback>{p.displayName?.[0] ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{p.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell className="text-center">
                          {event.checkedInUids?.includes(p.uid) ? (
                            <Badge variant="secondary" className="text-green-600 border-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Yes
                            </Badge>
                          ) : (
                             <Badge variant="outline">
                              <XCircle className="mr-2 h-4 w-4" />
                              No
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No one has RSVP'd yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
