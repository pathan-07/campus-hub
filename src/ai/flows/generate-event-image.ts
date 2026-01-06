'use server';
/**
 * @fileOverview An AI agent that generates an image for an event based on its title and description.
 *
 * - generateEventImage - A function that takes event details and returns a data URI for a generated image.
 * - GenerateEventImageInput - The input type for the generateEventImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventImageInputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  description: z.string().describe('A brief description of the event.'),
});
export type GenerateEventImageInput = z.infer<typeof GenerateEventImageInputSchema>;

export async function generateEventImage(input: GenerateEventImageInput): Promise<string | undefined> {
  return generateEventImageFlow(input);
}

const generateEventImageFlow = ai.defineFlow(
  {
    name: 'generateEventImageFlow',
    inputSchema: GenerateEventImageInputSchema,
    outputSchema: z.string().optional(),
  },
  async ({title, description}) => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate an engaging and relevant image for a community event.

Event Title: "${title}"
Event Description: "${description}"

The image should be vibrant and suitable for a promotional banner on a website. Focus on the key themes of the event. For example, if it's a tech talk, show people learning or code on a screen. If it's a festival, show a joyful, celebratory scene. Avoid text in the image.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      return media?.url ?? undefined;
    } catch (error) {
      console.error('Image generation failed:', error);
      // Return undefined instead of throwing an error to prevent the entire event creation from failing.
      return undefined;
    }
  }
);
