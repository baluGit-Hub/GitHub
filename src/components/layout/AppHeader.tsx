import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LogoutButton from '@/components/auth/LogoutButton';
import { Waves, User } from 'lucide-react';

interface AppHeaderProps {
  userName?: string;
  userAvatarUrl?: string;
}

export default function AppHeader({ userName, userAvatarUrl }: AppHeaderProps) {
  return (
    <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Waves size={32} className="text-primary" />
          <h1 className="text-2xl font-headline font-semibold text-primary">Repo Surfer</h1>
        </Link>
        {userName && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatarUrl} alt={userName} />
                <AvatarFallback>
                  <User size={18} />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{userName}</span>
            </div>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
