'use server';

/**
 * @fileOverview Campus resource question answering AI agent.
 *
 * - answerCampusResourceQuestion - A function that handles answering questions about campus resources.
 * - AnswerCampusResourceQuestionInput - The input type for the answerCampusResourceQuestion function.
 * - AnswerCampusResourceQuestionOutput - The return type for the answerCampusResourceQuestion function.
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

const AnswerCampusResourceQuestionInputSchema = z.object({
  question: z.string(),
  events: z.array(EventSchema).optional(),
});
export type AnswerCampusResourceQuestionInput = z.infer<typeof AnswerCampusResourceQuestionInputSchema>;

const AnswerCampusResourceQuestionOutputSchema = z.object({
  answer: z.string(),
});
export type AnswerCampusResourceQuestionOutput = z.infer<typeof AnswerCampusResourceQuestionOutputSchema>;

export async function answerCampusResourceQuestion(input: AnswerCampusResourceQuestionInput): Promise<AnswerCampusResourceQuestionOutput> {
  return answerCampusResourceQuestionFlow(input);
}

const answerCampusResourceQuestionPrompt = ai.definePrompt({
  name: 'answerCampusResourceQuestionPrompt',
  input: {schema: AnswerCampusResourceQuestionInputSchema},
  output: {schema: AnswerCampusResourceQuestionOutputSchema},
  prompt: `You are a helpful chatbot for a university campus. Your role is to answer questions about campus resources and events.

You have been provided with a list of current events. Use this list to answer any questions about what's happening on campus, such as "what events are there today?", "how many events are there?", or "tell me about the AI event".

If the user asks a general question not related to the events, answer it based on your general knowledge of campus resources.

Current Events Data:
{{#if events}}
{{#each events}}
- Title: {{this.title}}
  Description: {{this.description}}
  Location: {{this.venue}}, {{this.location}}
  Date: {{this.date}}
  {{#if this.mapLink}}Map: {{this.mapLink}}{{/if}}
  {{#if this.registrationLink}}Registration: {{this.registrationLink}}{{/if}}
{{/each}}
{{else}}
No events are currently scheduled.
{{/if}}

Question: {{{question}}}
  `,
});

const answerCampusResourceQuestionFlow = ai.defineFlow(
  {
    name: 'answerCampusResourceQuestionFlow',
    inputSchema: AnswerCampusResourceQuestionInputSchema,
    outputSchema: AnswerCampusResourceQuestionOutputSchema,
  },
  async input => {
    try {
      const {output} = await answerCampusResourceQuestionPrompt(input);
      return output!;
    } catch (error) {
      console.error('Error in answerCampusResourceQuestionFlow:', error);
      throw error; // Re-throw the error so the calling function can handle it.
    }
  }
);
