'use client';

import { useEffect, useState } from 'react';
import { getUsersStream } from '@/lib/users';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Crown, Star, Info, TrendingUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const unsubscribe = getUsersStream(
      (newUsers) => {
        setUsers(newUsers);
        setLoading(false);
        setError(null);
      },
      (streamError) => {
        console.error('Failed to load leaderboard:', streamError);
        setError('We could not load the leaderboard right now.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Top 3 Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3" />
                <Skeleton className="h-5 w-24 mx-auto mb-2" />
                <Skeleton className="h-6 w-16 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Table Skeleton */}
        <Card>
          <CardContent className="pt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>
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

  const topThree = users.slice(0, 3);
  const restOfUsers = users.slice(3);

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = topThree.length >= 3 
    ? [topThree[1], topThree[0], topThree[2]] 
    : topThree;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-500" />;
    return null;
  };

  const getRankStyles = (rank: number) => {
    if (rank === 1) return 'ring-4 ring-yellow-400/50 bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20';
    if (rank === 2) return 'ring-2 ring-gray-300/50 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800/30 dark:to-gray-700/20';
    if (rank === 3) return 'ring-2 ring-orange-300/50 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20';
    return '';
  };

  const currentUserRank = currentUser 
    ? users.findIndex(u => u.uid === currentUser.uid) + 1 
    : null;

  return (
    <div className="space-y-6">
      {/* Points Explanation */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">How Points Work</h3>
              <p className="text-sm text-muted-foreground">
                Earn <span className="font-semibold text-primary">5 points</span> for each event you RSVP to, 
                and <span className="font-semibold text-primary">10 bonus points</span> when you check in at the event. 
                Climb the leaderboard by attending more campus events!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current User Rank (if not in top 3) */}
      {currentUserRank && currentUserRank > 3 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  #{currentUserRank}
                </div>
                <div>
                  <p className="font-semibold">Your Ranking</p>
                  <p className="text-sm text-muted-foreground">Keep attending events to climb up!</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {users.find(u => u.uid === currentUser?.uid)?.points ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {podiumOrder.map((user, index) => {
            if (!user) return null;
            const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
            const isCurrentUser = currentUser?.uid === user.uid;
            
            return (
              <Card 
                key={user.uid}
                className={cn(
                  'text-center transition-all hover:scale-105',
                  index === 1 ? 'md:-mt-4 order-1 md:order-2' : index === 0 ? 'order-2 md:order-1' : 'order-3',
                  isCurrentUser && 'border-primary shadow-lg'
                )}
              >
                <CardContent className={cn('pt-4 pb-4 md:pt-6 md:pb-6', getRankStyles(actualRank))}>
                  <div className="flex justify-center mb-2">
                    {getRankIcon(actualRank)}
                  </div>
                  <Avatar className={cn(
                    'mx-auto mb-3',
                    index === 1 ? 'h-16 w-16 md:h-20 md:w-20' : 'h-12 w-12 md:h-16 md:w-16',
                    isCurrentUser && 'ring-2 ring-primary'
                  )}>
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback className="text-lg md:text-xl">
                      {user.displayName?.[0].toUpperCase() ?? user.email?.[0].toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <p className={cn(
                    'font-semibold truncate px-2',
                    index === 1 ? 'text-base md:text-lg' : 'text-sm md:text-base'
                  )}>
                    {user.displayName || 'Anonymous'}
                    {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                    <span className={cn(
                      'font-bold text-primary',
                      index === 1 ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'
                    )}>
                      {user.points}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.eventsAttended || 0} events
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rest of Leaderboard */}
      {restOfUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-headline">Rankings</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Points = Events attended × score per event</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center w-[80px]">Events</TableHead>
                  <TableHead className="text-right w-[80px]">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restOfUsers.map((user, index) => {
                  const rank = index + 4;
                  const isCurrentUser = currentUser?.uid === user.uid;
                  
                  return (
                    <TableRow 
                      key={user.uid}
                      className={cn(isCurrentUser && 'bg-primary/5 border-l-2 border-l-primary')}
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        #{rank}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={cn('h-8 w-8', isCurrentUser && 'ring-2 ring-primary')}>
                            <AvatarImage src={user.photoURL ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {user.displayName?.[0].toUpperCase() ?? 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn('font-medium', isCurrentUser && 'text-primary')}>
                            {user.displayName || 'Anonymous'}
                            {isCurrentUser && <span className="ml-1 text-xs">(You)</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {user.eventsAttended || 0}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {user.points}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
            <p className="text-muted-foreground">
              Be the first to attend an event and appear on the leaderboard!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
