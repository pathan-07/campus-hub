'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, QrCode, User, ScanLine, XCircle, CheckCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { checkInUser } from '@/lib/events';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ScannedData = {
  userId: string;
  eventId: string;
  userName: string;
  userEmail: string;
};

export default function ScanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Request camera permission
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
        setIsScanning(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };
    if (user) {
       getCameraPermission();
    }
     return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [user]);

  // QR Code Scanning Loop
  useEffect(() => {
    let animationFrameId: number;

    const scan = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(scan);
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          try {
            const data = JSON.parse(code.data) as ScannedData;
            if (data.userId && data.eventId && data.userName && data.userEmail) {
                setScannedData(data);
                setIsScanning(false);
                 if (videoRef.current && videoRef.current.srcObject) {
                    (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                }
            }
          } catch (e) {
            // Not a valid JSON QR code for our app, just ignore
          }
        }
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    if(isScanning) {
        animationFrameId = requestAnimationFrame(scan);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isScanning]);


  const handleCheckIn = async () => {
    if (!scannedData) return;

    setIsCheckingIn(true);
    setScanResult(null);

    try {
      await checkInUser(scannedData.eventId, scannedData.userId);
      setScanResult({ type: 'success', message: `${scannedData.userName} checked in successfully!` });
      toast({
        title: 'Check-in Successful',
        description: `${scannedData.userName} has been marked as attended.`,
      });
    } catch (error: any) {
       setScanResult({ type: 'error', message: error.message || 'An unknown error occurred.' });
       toast({
        variant: 'destructive',
        title: 'Check-in Failed',
        description: error.message || 'Could not check in the user. Please try again.',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };
  
  const handleScanAgain = () => {
    setScannedData(null);
    setScanResult(null);
    if(videoRef.current && !videoRef.current.srcObject) {
         navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                 if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsScanning(true);
                }
            }).catch(err => {
                 console.error("Failed to re-acquire camera", err);
                 setHasCameraPermission(false);
            })
    } else {
        setIsScanning(true);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <QrCode />
              Event Check-in
            </CardTitle>
            <CardDescription>
              Scan an attendee's QR code ticket to verify and check them in.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Camera Access Denied</AlertTitle>
                  <AlertDescription>
                    Please enable camera permissions in your browser settings to use the scanner.
                  </AlertDescription>
                </Alert>
            )}

            {hasCameraPermission && (
              <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                {isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                        <ScanLine className="h-24 w-24 text-white/80 animate-pulse" />
                        <p className="text-white font-bold mt-4">Point at a QR code</p>
                    </div>
                )}
                 {scannedData && !scanResult && (
                     <div className="absolute inset-0 p-6 bg-background/90 flex flex-col items-center justify-center text-center">
                        <User className="h-16 w-16 text-primary" />
                        <h3 className="text-xl font-bold mt-4">{scannedData.userName}</h3>
                        <p className="text-muted-foreground">{scannedData.userEmail}</p>
                     </div>
                 )}
                 {scanResult && (
                     <div className={`absolute inset-0 p-6 bg-background/90 flex flex-col items-center justify-center text-center`}>
                        {scanResult.type === 'success' ? (
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        ) : (
                            <XCircle className="h-16 w-16 text-destructive" />
                        )}
                        <h3 className="text-xl font-bold mt-4">
                            {scanResult.type === 'success' ? 'Check-in Complete' : 'Check-in Failed'}
                        </h3>
                        <p className="text-muted-foreground">{scanResult.message}</p>
                     </div>
                 )}
              </div>
            )}
            
          </CardContent>
           <CardFooter className="flex flex-col gap-2">
            {!scannedData && hasCameraPermission && (
              <Button className="w-full" disabled>
                Scanning...
              </Button>
            )}
             {scannedData && !scanResult && (
               <>
                 <Button className="w-full" onClick={handleCheckIn} disabled={isCheckingIn}>
                   {isCheckingIn ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Checking in...
                     </>
                   ) : (
                     'Confirm Check-in'
                   )}
                 </Button>
                  <Button variant="outline" className="w-full" onClick={handleScanAgain} disabled={isCheckingIn}>
                    Cancel
                </Button>
               </>
             )}
              {(scanResult || hasCameraPermission === false) && (
                 <Button className="w-full" onClick={handleScanAgain}>
                    Scan Another Ticket
                </Button>
              )}
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}