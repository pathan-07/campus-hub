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
import { Download } from 'lucide-react';

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeDataUrl: string;
  eventName: string;
}

export function QrCodeDialog({ open, onOpenChange, qrCodeDataUrl, eventName }: QrCodeDialogProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `event-ticket-${eventName.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Your Ticket for "{eventName}"</DialogTitle>
          <DialogDescription>
            Present this QR code at the event for verification. You can download the ticket or take a screenshot.
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
        <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
