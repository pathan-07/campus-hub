import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendTicketEmail } from '@/ai/flows/send-ticket-email';

const BodySchema = z.object({
  userEmail: z.string().email(),
  userName: z.string().min(1),
  eventName: z.string().min(1),
  qrCodeDataUrl: z.string().min(1),
});

export async function POST(request: Request) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  try {
    const result = await sendTicketEmail(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to send ticket email.' },
      { status: 500 }
    );
  }
}
