'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getEventById } from '@/lib/events';
import { getCommentsStream, addComment } from '@/lib/comments';
import type { Event, Comment } from '@/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EventCard } from '@/components/EventCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

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

  const [event, setEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <EventCard event={event} />

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
    </div>
  );
}
