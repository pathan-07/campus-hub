'use server';
/**
 * @fileOverview An AI agent that generates an image for an event and saves it.
 *
 * - generateAndSaveEventImage - Generates an image based on event details, uploads it to storage,
 *   and updates the Firestore event document with the image URL.
 * - GenerateImageInput - The input type for the flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { uploadImageFromBase64 } from '@/lib/storage';

const db = getFirestore(app);

const GenerateImageInputSchema = z.object({
  eventId: z.string().describe('The ID of the event document in Firestore.'),
  eventTitle: z.string().describe('The title of the event.'),
  eventDescription: z.string().describe('The description of the event.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export async function generateAndSaveEventImage(input: GenerateImageInput): Promise<void> {
  return generateEventImageFlow(input);
}

const generateEventImageFlow = ai.defineFlow(
  {
    name: 'generateEventImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: z.void(),
  },
  async ({ eventId, eventTitle, eventDescription }) => {
    console.log(`Generating image for event: ${eventTitle}`);

    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a vibrant and professional banner image for an event with the title "${eventTitle}" and description "${eventDescription}". The image should be visually appealing and relevant to the event's theme. Avoid text in the image.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('AI did not return an image.');
      }
      
      const base64Data = media.url.substring(media.url.indexOf(',') + 1);
      const imagePath = `event-images/${eventId}.png`;

      const downloadURL = await uploadImageFromBase64(imagePath, base64Data);

      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        imageUrl: downloadURL,
      });

      console.log(`Successfully generated and saved image for event ${eventId}`);
    } catch (error) {
      console.error(`Failed to generate and save image for event ${eventId}:`, error);
    }
  }
);
