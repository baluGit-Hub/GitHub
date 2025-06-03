import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import type { GitHubUser } from '@/types/github';

interface UserProfileCardProps {
  user: GitHubUser;
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">User Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center space-x-4">
        <Avatar className="h-20 w-20 border-2 border-primary">
          <AvatarImage src={user.avatar_url} alt={user.login} />
          <AvatarFallback>
            <User size={36} />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{user.name || user.login}</h2>
          <p className="text-sm text-muted-foreground">@{user.login}</p>
        </div>
      </CardContent>
    </Card>
  );
}
