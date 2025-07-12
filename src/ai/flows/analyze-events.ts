'use server';
/**
 * @fileOverview An AI agent that analyzes event data to provide insights.
 *
 * - analyzeEvents - A function that analyzes a list of events and returns a summary and structured data.
 * - AnalyzeEventsInput - The input type for the analyzeEvents function.
 * - AnalyzeEventsOutput - The return type for the analyzeEvents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EventSchema = z.object({
  title: z.string(),
  description: z.string(),
  venue: z.string(),
  location: z.string(),
  date: z.string(),
  mapLink: z.string().optional(),
  registrationLink: z.string().optional(),
});

const AnalyzeEventsInputSchema = z.object({
  events: z.array(EventSchema),
});
export type AnalyzeEventsInput = z.infer<typeof AnalyzeEventsInputSchema>;

const AnalyzeEventsOutputSchema = z.object({
  summary: z.string(),
  eventsByLocation: z.array(z.object({
    location: z.string(),
    count: z.number(),
  })),
});
export type AnalyzeEventsOutput = z.infer<typeof AnalyzeEventsOutputSchema>;

export async function analyzeEvents(input: AnalyzeEventsInput): Promise<AnalyzeEventsOutput> {
  return analyzeEventsFlow(input);
}

const analyzeEventsPrompt = ai.definePrompt({
  name: 'analyzeEventsPrompt',
  input: {schema: AnalyzeEventsInputSchema},
  output: {schema: AnalyzeEventsOutputSchema},
  prompt: `You are a data analyst for a university. Your task is to analyze the provided list of campus events and generate insights.

Based on the event data, provide a short, insightful summary of event activity. For example, mention which locations are most popular or if there's a trend in the types of events being posted.

Also, provide a structured breakdown of the number of events per location.

Event Data:
{{#each events}}
- Title: {{this.title}}
  Location: {{this.venue}}, {{this.location}}
  Date: {{this.date}}
{{/each}}
  `,
});

const analyzeEventsFlow = ai.defineFlow(
  {
    name: 'analyzeEventsFlow',
    inputSchema: AnalyzeEventsInputSchema,
    outputSchema: AnalyzeEventsOutputSchema,
  },
  async input => {
    const {output} = await analyzeEventsPrompt(input);
    return output!;
  }
);
