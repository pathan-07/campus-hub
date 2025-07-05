'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CreateEventButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = () => {
    if (loading) return;
    if (user) {
      setIsDialogOpen(true);
    } else {
      toast({
        title: 'Authentication Required',
        description: 'You need to be logged in to post an event.',
        action: (
          <Button onClick={() => router.push('/login')}>Login</Button>
        ),
      });
    }
  };

  return (
    <>
      <Button onClick={handleClick} disabled={loading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
        <PlusCircle className="mr-2 h-4 w-4" />
        Post Event
      </Button>
      <CreateEventDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
