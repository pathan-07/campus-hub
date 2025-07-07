'use client';

import { useEffect, useState } from 'react';
import { getEventsStream } from '@/lib/events';
import { analyzeEvents, type AnalyzeEventsOutput } from '@/ai/flows/analyze-events';
import type { Event } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';


export function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyzeEventsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = getEventsStream(async (events) => {
      if (events.length > 0) {
        try {
          // Plain objects for the server function
          const plainEvents = events.map(e => ({
            title: e.title,
            description: e.description,
            location: e.location,
            date: e.date,
            registrationLink: e.registrationLink
          }));

          const result = await analyzeEvents({ events: plainEvents });
          setAnalytics(result);
        } catch (e: any) {
          console.error("Failed to analyze events:", e);
          setError(e.message || "An unknown error occurred during analysis.");
        }
      } else {
        // Handle case with no events
        setAnalytics({ summary: "No events posted yet. Post an event to see analytics.", eventsByLocation: [] });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
             <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
     return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Analysis Failed</AlertTitle>
        <AlertDescription>
          There was an error generating the event analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI Summary</CardTitle>
          <CardDescription>An AI-generated overview of event activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{analytics?.summary}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Events by Location</CardTitle>
           <CardDescription>A breakdown of event counts per location.</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics && analytics.eventsByLocation.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.eventsByLocation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                        }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p>No location data to display.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
