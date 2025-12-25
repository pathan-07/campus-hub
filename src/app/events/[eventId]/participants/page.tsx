
// src/app/events/[eventId]/participants/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getParticipantsForEvent, type Participant } from '@/lib/users';
import { getEventById, checkInUser } from '@/lib/events';
import type { Event } from '@/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Loader } from '@/components/Loader';
import { CheckCircle, XCircle, ArrowLeft, UserCheck, Loader2, Search, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ParticipantsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingInUserId, setCheckingInUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      // 1. Fetch Event to check ownership
      const eventData = await getEventById(eventId);
      if (!eventData) throw new Error('Event not found.');
      
      if (eventData.authorId !== user.uid) {
        throw new Error('You are not authorized to view this page.');
      }
      setEvent(eventData);

      // 2. Fetch Participants
      const data = await getParticipantsForEvent(eventId);
      setParticipants(data);

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load data.');
    }
  }, [eventId, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    loadData();
  }, [user, authLoading, eventId, router, fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Participant list has been updated.',
    });
  };

  const handleManualCheckIn = async (participant: Participant) => {
    if (checkingInUserId) return; // Prevent multiple simultaneous check-ins
    
    setCheckingInUserId(participant.profile.uid);
    
    try {
      const result = await checkInUser(eventId, participant.profile.uid);
      
      if (result.success) {
        // Update local state
        setParticipants(prev => 
          prev.map(p => 
            p.profile.uid === participant.profile.uid 
              ? { ...p, checkedIn: true, checkedInAt: new Date().toISOString() }
              : p
          )
        );
        
        toast({
          title: 'Check-in Successful',
          description: `${participant.profile.displayName || 'User'} has been checked in.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: result.message,
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to check in user.',
      });
    } finally {
      setCheckingInUserId(null);
    }
  };

  // Filter participants based on search
  const filteredParticipants = participants.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.profile.displayName?.toLowerCase().includes(query) ||
      p.profile.email?.toLowerCase().includes(query)
    );
  });

  const checkedInCount = participants.filter(p => p.checkedIn).length;

  if (authLoading || loading) {
    return <Loader fullScreen size="lg" text="Loading participants..." />;
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Attendee List</CardTitle>
                <CardDescription>
                  Total Registered: {participants.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-medium text-muted-foreground">Checked In</span>
                  <p className="text-2xl font-bold text-green-600">
                    {checkedInCount} / {participants.length}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((p) => (
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
                        <TableCell className="text-center">
                          {p.checkedIn ? (
                            <span className="text-sm text-muted-foreground">—</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleManualCheckIn(p)}
                              disabled={checkingInUserId === p.profile.uid}
                            >
                              {checkingInUserId === p.profile.uid ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Check In
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No participants match your search.' : 'No one has registered yet.'}
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
