'use client';

import { useEffect, useState } from 'react';

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-6 text-center text-muted-foreground">
      <p>Campus Hub &copy; {year}</p>
    </footer>
  );
}
