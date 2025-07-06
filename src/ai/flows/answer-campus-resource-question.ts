// 'use server';

/**
 * @fileOverview Campus resource question answering AI agent.
 *
 * - answerCampusResourceQuestion - A function that handles answering questions about campus resources.
 * - AnswerCampusResourceQuestionInput - The input type for the answerCampusResourceQuestion function.
 * - AnswerCampusResourceQuestionOutput - The return type for the answerCampusResourceQuestion function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerCampusResourceQuestionInputSchema = z.object({
  question: z.string().describe('The question about campus resources.'),
});
export type AnswerCampusResourceQuestionInput = z.infer<typeof AnswerCampusResourceQuestionInputSchema>;

const AnswerCampusResourceQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about campus resources.'),
});
export type AnswerCampusResourceQuestionOutput = z.infer<typeof AnswerCampusResourceQuestionOutputSchema>;

export async function answerCampusResourceQuestion(input: AnswerCampusResourceQuestionInput): Promise<AnswerCampusResourceQuestionOutput> {
  return answerCampusResourceQuestionFlow(input);
}

const answerCampusResourceQuestionPrompt = ai.definePrompt({
  name: 'answerCampusResourceQuestionPrompt',
  input: {schema: AnswerCampusResourceQuestionInputSchema},
  output: {schema: AnswerCampusResourceQuestionOutputSchema},
  prompt: `You are a helpful chatbot that answers questions about campus resources.

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
