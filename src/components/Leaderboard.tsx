'use client';

import { useEffect, useState } from 'react';
import { getUsersStream } from '@/lib/users';
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
import { Medal } from 'lucide-react';

export function Leaderboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getUsersStream((newUsers) => {
      setUsers(newUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </TableCell>
                <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.uid}>
              <TableCell className="font-bold text-lg">
                <div className="flex items-center gap-2">
                   {index < 3 ? (
                      <Medal className={`h-6 w-6 ${getRankColor(index + 1)}`} />
                    ) : (
                      <span className="w-6 text-center">{index + 1}</span>
                    )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback>
                      {user.displayName?.[0].toUpperCase() ?? user.email?.[0].toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.displayName}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-primary text-lg">{user.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
