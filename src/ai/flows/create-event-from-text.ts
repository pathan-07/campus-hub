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
    title: z.string(),
    description: z.string(),
    venue: z.string(),
    location: z.string(),
    date: z.string(),
    type: z.enum(['college', 'other']).describe("The type of event. If the event seems to be a student or campus-related event, classify it as 'college'. Otherwise, classify it as 'other'."),
    mapLink: z.string().url().optional(),
    registrationLink: z.string().optional(),
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

From the following text, extract the event's title, a detailed description, the specific venue (e.g., "Library Room 4B", "Grand Hall"), the city (location), the full date and time, a Google Maps link if provided, a registration link if provided, and the event type.

If the event sounds like it's specifically for college students or happening on a campus (e.g., study sessions, club meetings, campus fairs), classify its type as 'college'. For all other events (e.g., general public concerts, city-wide festivals), classify the type as 'other'.

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
            // Re-throw the original error to provide more specific feedback on the client.
            throw error;
        }
    }
);
