
// src/app/events/[eventId]/participants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getParticipantsForEvent, type Participant } from '@/lib/users';
import { getEventById } from '@/lib/events';
import type { Event } from '@/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function ParticipantsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Event to check ownership
        const eventData = await getEventById(eventId);
        if (!eventData) throw new Error('Event not found.');
        
        if (eventData.authorId !== user.uid) {
          throw new Error('You are not authorized to view this page.');
        }
        setEvent(eventData);

        // 2. Fetch Participants using our new function
        const data = await getParticipantsForEvent(eventId);
        setParticipants(data);

      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, eventId, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container mx-auto p-4">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/">Go Home</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-2 pl-0 hover:bg-transparent hover:text-primary">
            <Link href={`/events/${eventId}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Event
            </Link>
          </Button>
          <h1 className="text-3xl font-headline font-bold">Participants</h1>
          <p className="text-muted-foreground">For "{event?.title}"</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Attendee List</CardTitle>
                <CardDescription>
                  Total Registered: {participants.length}
                </CardDescription>
              </div>
              <div className="text-right">
                 <span className="text-sm font-medium text-muted-foreground">Checked In</span>
                 <p className="text-2xl font-bold text-green-600">
                   {participants.filter(p => p.checkedIn).length}
                 </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.length > 0 ? (
                    participants.map((p) => (
                      <TableRow key={p.profile.uid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={p.profile.photoURL ?? undefined} />
                              <AvatarFallback>{p.profile.displayName?.[0] ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{p.profile.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{p.profile.email}</TableCell>
                        <TableCell className="text-center">
                          {p.checkedIn ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                              <CheckCircle className="mr-1 h-3 w-3" /> Checked In
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No one has registered yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
