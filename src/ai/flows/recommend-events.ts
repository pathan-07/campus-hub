'use server';
/**
 * @fileOverview An AI agent that recommends new events to a user based on their past attendance.
 *
 * - recommendEvents - A function that takes attended and upcoming events and returns a list of recommended event IDs.
 * - RecommendEventsInput - The input type for the recommendEvents function.
 * - RecommendEventsOutput - The return type for the recommendEvents function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EventInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
});

const AttendedEventInfoSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
});

const RecommendEventsInputSchema = z.object({
  attendedEvents: z.array(AttendedEventInfoSchema),
  upcomingEvents: z.array(EventInfoSchema),
});
export type RecommendEventsInput = z.infer<typeof RecommendEventsInputSchema>;

const RecommendEventsOutputSchema = z.object({
  recommendedEventIds: z.array(z.string()).describe("An array of IDs of the recommended events."),
});
export type RecommendEventsOutput = z.infer<typeof RecommendEventsOutputSchema>;

export async function recommendEvents(input: RecommendEventsInput): Promise<RecommendEventsOutput> {
  return recommendEventsFlow(input);
}

const recommendEventsPrompt = ai.definePrompt({
  name: 'recommendEventsPrompt',
  input: { schema: RecommendEventsInputSchema },
  output: { schema: RecommendEventsOutputSchema },
  prompt: `You are a personalized event recommendation engine for a university campus.
Your task is to analyze the events a user has attended in the past and recommend up to 3 relevant events from the list of upcoming events.

Do not recommend events that the user has already attended or events that are very similar to ones they've already attended. Prioritize variety unless the user shows a very strong preference for a single category.

Analyze the titles, descriptions, and categories to find patterns in the user's interests.

Events the user has attended:
{{#each attendedEvents}}
- Title: "{{this.title}}" (Category: {{this.category}})
  Description: {{this.description}}
{{/each}}

List of all upcoming events available for recommendation:
{{#each upcomingEvents}}
- ID: {{this.id}}
  Title: "{{this.title}}" (Category: {{this.category}})
  Description: {{this.description}}
{{/each}}

Based on your analysis, provide a list of the IDs for the recommended events.
`,
});

const recommendEventsFlow = ai.defineFlow(
  {
    name: 'recommendEventsFlow',
    inputSchema: RecommendEventsInputSchema,
    outputSchema: RecommendEventsOutputSchema,
  },
  async (input) => {
    // If there are no upcoming events or no attended events, return no recommendations.
    if (input.upcomingEvents.length === 0 || input.attendedEvents.length === 0) {
      return { recommendedEventIds: [] };
    }

    const { output } = await recommendEventsPrompt(input);
    return output!;
  }
);
