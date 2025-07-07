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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { addEvent } from '@/lib/events';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { createEventFromText } from '@/ai/flows/create-event-from-text';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gujaratCities } from '@/lib/locations';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  venue: z.string().min(3, 'Venue is required'),
  location: z.string().min(1, 'City is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  mapLink: z.string().url({ message: "Please enter a valid Google Maps URL." }).optional().or(z.literal('')),
  registrationLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [eventText, setEventText] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    control,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      registrationLink: '',
      mapLink: '',
      location: '',
      venue: '',
    },
  });

  const handleGenerate = async () => {
    if (!eventText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please describe the event first.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await createEventFromText({
        text: eventText,
        currentDate: new Date().toISOString(),
      });

      setValue('title', result.title);
      setValue('description', result.description);
      setValue('venue', result.venue);
      setValue('location', result.location);
      setValue('date', result.date);
      setValue('mapLink', result.mapLink || '');
      setValue('registrationLink', result.registrationLink || '');

      setStep(2);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: error.message || 'Could not generate event details. Please try again or fill out the form manually.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'You must be logged in to create an event.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        ...data,
        date: new Date(data.date).toISOString(),
      };

      if (!eventData.registrationLink) {
        delete (eventData as Partial<typeof eventData>).registrationLink;
      }
      if (!eventData.mapLink) {
        delete (eventData as Partial<typeof eventData>).mapLink;
      }

      await addEvent(eventData, user);
      toast({
        title: 'Event Created!',
        description: 'Your event has been posted successfully.',
      });
      handleCloseDialog();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create event. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseDialog = () => {
    reset();
    setEventText('');
    setStep(1);
    onOpenChange(false);
  };

  const switchToManual = () => {
    reset();
    setStep(2);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleCloseDialog();
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            {step === 2 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === 1 ? 'Describe Your Event' : 'Review and Post'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Let AI create the event for you. Just describe it below.'
              : 'Check the details generated by AI and make any changes.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="e.g., Let's host a study session for the final exams next Tuesday at 3pm in the library study room 4B, Ahmedabad."
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              rows={6}
            />
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Event Details
                </>
              )}
            </Button>
            <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
            </div>
            <Button variant="outline" onClick={switchToManual}>Fill Form Manually</Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} className="pt-4">
            <div className="max-h-[60vh] overflow-y-auto pr-4">
              <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" {...register('title')} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...register('description')} />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input id="venue" {...register('venue')} placeholder="e.g., Mahatma Mandir" />
                    {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">City</Label>
                     <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="location">
                            <SelectValue placeholder="Select a city" />
                          </SelectTrigger>
                          <SelectContent>
                            {gujaratCities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date and Time</Label>
                    <Input id="date" type="datetime-local" {...register('date')} />
                    {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="registrationLink">Registration Link (optional)</Label>
                    <Input id="registrationLink" type="url" placeholder="https://example.com/register" {...register('registrationLink')} />
                    {errors.registrationLink && <p className="text-sm text-destructive">{errors.registrationLink.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mapLink">Google Maps Link (optional)</Label>
                    <Input id="mapLink" type="url" placeholder="https://maps.app.goo.gl/..." {...register('mapLink')} />
                    {errors.mapLink && <p className="text-sm text-destructive">{errors.mapLink.message}</p>}
                  </div>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Event'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
