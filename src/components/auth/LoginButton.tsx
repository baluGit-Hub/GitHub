'use client';

import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import Link from 'next/link';

export default function LoginButton() {
  return (
    <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
      <Link href="/api/auth/github/login">
        <Github className="mr-2 h-5 w-5" />
        Sign in with GitHub
      </Link>
    </Button>
  );
}
