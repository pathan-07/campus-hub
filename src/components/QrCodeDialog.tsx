'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeDataUrl: string;
  eventName: string;
}

export function QrCodeDialog({ open, onOpenChange, qrCodeDataUrl, eventName }: QrCodeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Your Ticket for "{eventName}"</DialogTitle>
          <DialogDescription>
            Present this QR code at the event for verification. You can take a screenshot or save the image.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          {qrCodeDataUrl && (
            <Image
              src={qrCodeDataUrl}
              alt={`QR Code for ${eventName}`}
              width={256}
              height={256}
              className="rounded-lg"
            />
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
