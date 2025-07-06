'use server';
/**
 * @fileOverview An AI agent that creates structured event data from unstructured text.
 *
 * - createEventFromText - A function that parses natural language and returns structured event data.
 * - CreateEventFromTextInput - The input type for the createEventFromtext function.
 * - EventData - The return type for the createEventFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateEventFromTextInputSchema = z.object({
  text: z.string().describe('The natural language description of the event.'),
  currentDate: z.string().describe("The current date in ISO format, to help resolve relative dates like 'tomorrow' or 'next Friday'."),
});
export type CreateEventFromTextInput = z.infer<typeof CreateEventFromTextInputSchema>;

const EventDataSchema = z.object({
    title: z.string().describe('The title of the event.'),
    description: z.string().describe('A detailed description of the event.'),
    location: z.string().describe('The location where the event will take place.'),
    date: z.string().describe("The event date and time in 'YYYY-MM-DDTHH:mm' format suitable for a datetime-local input."),
    registrationLink: z.string().url().optional().describe('The registration link for the event, if mentioned.'),
});
export type EventData = z.infer<typeof EventDataSchema>;

export async function createEventFromText(input: CreateEventFromTextInput): Promise<EventData> {
  return createEventFlow(input);
}

const createEventPrompt = ai.definePrompt({
    name: 'createEventPrompt',
    input: { schema: CreateEventFromTextInputSchema },
    output: { schema: EventDataSchema },
    prompt: `You are an expert event planner's assistant. Your task is to extract structured event information from a block of text.

Today's date is {{currentDate}}. Use this to correctly interpret relative dates (e.g., "tomorrow", "next Friday").

From the following text, extract the event's title, a detailed description, its location, the full date and time, and a registration link if provided.

The output for the 'date' field MUST be in a format compatible with an HTML datetime-local input, which is 'YYYY-MM-DDTHH:mm'.

Event Text:
"{{text}}"`,
});

const createEventFlow = ai.defineFlow(
    {
        name: 'createEventFlow',
        inputSchema: CreateEventFromTextInputSchema,
        outputSchema: EventDataSchema,
    },
    async (input) => {
        try {
            const { output } = await createEventPrompt(input);
            if (!output) {
                throw new Error("The AI model returned an empty response. Please try again.");
            }
            return output;
        } catch (error) {
            console.error("Error in createEventFlow:", error);
            // This error is propagated to the client. A common cause is a missing GOOGLE_API_KEY.
            throw new Error("Failed to generate event. This is often caused by a missing or invalid GOOGLE_API_KEY in your .env file. Please check your configuration.");
        }
    }
);
