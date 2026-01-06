'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Download, Calendar, MapPin, Ticket, Info } from 'lucide-react';
import { format } from 'date-fns';

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeDataUrl: string;
  eventName: string;
  eventDate?: string;
  eventVenue?: string;
  userName?: string;
}

export function QrCodeDialog({ 
  open, 
  onOpenChange, 
  qrCodeDataUrl, 
  eventName,
  eventDate,
  eventVenue,
  userName,
}: QrCodeDialogProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `ticket-${eventName.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedDate = eventDate 
    ? format(new Date(eventDate), "EEEE, MMMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-primary px-6 py-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary-foreground">
              <Ticket className="h-5 w-5" />
              <DialogTitle className="font-headline text-primary-foreground">
                Event Ticket
              </DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/80">
              {eventName}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Ticket Body */}
        <div className="px-6 py-4">
          {/* Event Details */}
          <div className="space-y-3 mb-6">
            {userName && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Attendee</p>
                <p className="font-semibold text-lg">{userName}</p>
              </div>
            )}
            
            {formattedDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            )}
            
            {eventVenue && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{eventVenue}</span>
              </div>
            )}
          </div>

          {/* Dashed Divider - Ticket Perforation Effect */}
          <div className="relative my-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full -ml-6" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full -mr-6" />
            <div className="border-t-2 border-dashed border-muted-foreground/30" />
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center py-4">
            {qrCodeDataUrl && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Image
                  src={qrCodeDataUrl}
                  alt={`QR Code for ${eventName}`}
                  width={200}
                  height={200}
                  className="rounded"
                />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg mt-4">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Present this QR code at the event entrance for check-in. 
              You can download it or take a screenshot for offline access.
            </p>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
