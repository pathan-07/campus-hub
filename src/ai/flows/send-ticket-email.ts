'use server';
/**
 * @fileOverview A flow for sending an event ticket via email.
 * NOTE: This is a placeholder and does not actually send an email.
 * You would need to integrate an email service provider like SendGrid or Nodemailer here.
 *
 * - sendTicketEmail - A function that handles sending the ticket.
 * - SendTicketEmailInput - The input type for the sendTicketEmail function.
 * - SendTicketEmailOutput - The return type for the sendTicketEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendTicketEmailInputSchema = z.object({
  userEmail: z.string().email().describe("The recipient's email address."),
  userName: z.string().describe("The recipient's name."),
  eventName: z.string().describe('The name of the event.'),
  qrCodeDataUrl: z.string().describe('The QR code image as a Base64 data URI.'),
});
export type SendTicketEmailInput = z.infer<typeof SendTicketEmailInputSchema>;

const SendTicketEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendTicketEmailOutput = z.infer<typeof SendTicketEmailOutputSchema>;


export async function sendTicketEmail(input: SendTicketEmailInput): Promise<SendTicketEmailOutput> {
  return sendTicketEmailFlow(input);
}


const sendTicketEmailFlow = ai.defineFlow(
  {
    name: 'sendTicketEmailFlow',
    inputSchema: SendTicketEmailInputSchema,
    outputSchema: SendTicketEmailOutputSchema,
  },
  async (input) => {
    console.log(`Pretending to send email to ${input.userEmail} for event "${input.eventName}"`);
    
    // =================================================================
    // DEVELOPER ACTION REQUIRED: Implement your email sending logic here.
    //
    // This is a placeholder. To send real emails, you would use a service
    // like SendGrid, Mailgun, or Nodemailer with an SMTP provider.
    //
    // Example using Nodemailer (requires `npm install nodemailer`):
    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: 'smtp.example.com', // Your SMTP host
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Your email username
        pass: process.env.EMAIL_PASS, // Your email password
      },
    });

    const mailOptions = {
      from: '"Campus Hub" <no-reply@campushub.com>',
      to: input.userEmail,
      subject: `Your Ticket for ${input.eventName}`,
      html: `
        <h1>Hi ${input.userName},</h1>
        <p>Here is your ticket for the event: <strong>${input.eventName}</strong>.</p>
        <p>Please present this QR code at the event entrance.</p>
        <img src="${input.qrCodeDataUrl}" alt="Event Ticket QR Code" />
        <p>See you there!</p>
      `,
      attachments: [{
        filename: 'ticket.png',
        path: input.qrCodeDataUrl
      }]
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Email sent successfully.' };
    } catch (error) {
      console.error('Error sending email:', error);
      // In a real app, you might not want to throw the error to the client
      // but instead return a failure message.
      throw new Error('Failed to send ticket email.');
    }
    */
    // =================================================================
    
    // Since this is a placeholder, we'll just return a success message.
    return { success: true, message: 'Email sending process simulated.' };
  }
);
