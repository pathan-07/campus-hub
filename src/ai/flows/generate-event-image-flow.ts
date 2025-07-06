'use server';
/**
 * @fileOverview An AI agent that generates an image for an event based on its title and description.
 *
 * - generateEventImage - A function that creates an image for an event.
 * - GenerateEventImageInput - The input type for the generateEventImage function.
 * - GenerateEventImageOutput - The return type for the generateEventImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventImageInputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  description: z.string().describe('The description of the event.'),
});
export type GenerateEventImageInput = z.infer<typeof GenerateEventImageInputSchema>;

const GenerateEventImageOutputSchema = z.object({
  imageUrl: z.string().describe("A data URI of the generated image. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateEventImageOutput = z.infer<typeof GenerateEventImageOutputSchema>;

export async function generateEventImage(input: GenerateEventImageInput): Promise<GenerateEventImageOutput> {
  return generateEventImageFlow(input);
}

const generateEventImageFlow = ai.defineFlow(
  {
    name: 'generateEventImageFlow',
    inputSchema: GenerateEventImageInputSchema,
    outputSchema: GenerateEventImageOutputSchema,
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: `Generate a vibrant and inviting image for a university campus event titled '${input.title}'. The event is about: '${input.description}'. The style should be a modern, professional photograph that is engaging for students. Do not include any text in the image.`,
          config: {
              responseModalities: ['TEXT', 'IMAGE'],
          },
      });

      if (!media?.url) {
          throw new Error('Image generation succeeded but did not return a valid image URL.');
      }

      return { imageUrl: media.url };
    } catch (error) {
      console.error("Error calling the image generation API:", error);
      // Re-throw the error so the calling function in events.ts can catch it.
      throw new Error('Failed to generate image due to an API error. Please check the server logs and ensure your GOOGLE_API_KEY is valid.');
    }
  }
);
