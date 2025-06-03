import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, GitFork, Code, Globe, Lock, Unlock, Eye as EyeIcon } from 'lucide-react'; // Renamed Eye to EyeIcon to avoid conflict
import type { GitHubRepo } from '@/types/github';
import { Badge } from '@/components/ui/badge';

interface RepoCardProps {
  repo: GitHubRepo;
}

export default function RepoCard({ repo }: RepoCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-primary hover:underline">
            <Link href={repo.html_url} target="_blank" rel="noopener noreferrer">
              {repo.name}
            </Link>
          </CardTitle>
          {repo.private ? (
            <Badge variant="outline" className="text-xs">
              <Lock className="mr-1 h-3 w-3" /> Private
            </Badge>
          ) : (
             <Badge variant="secondary" className="text-xs">
              <Unlock className="mr-1 h-3 w-3" /> Public
            </Badge>
          )}
        </div>
        {repo.description && (
          <CardDescription className="text-sm text-muted-foreground pt-1 h-12 overflow-hidden text-ellipsis">
            {repo.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-xs text-muted-foreground">
          {repo.language && (
            <div className="flex items-center">
              <Code className="mr-2 h-4 w-4 text-primary" />
              <span>{repo.language}</span>
            </div>
          )}
          <div className="flex items-center">
            <Star className="mr-2 h-4 w-4 text-yellow-500" />
            <span>{repo.stargazers_count} Stars</span>
          </div>
          <div className="flex items-center">
            <GitFork className="mr-2 h-4 w-4 text-blue-500" />
            <span>{repo.forks_count} Forks</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 items-stretch pt-4">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={repo.html_url} target="_blank" rel="noopener noreferrer">
            <Globe className="mr-2 h-4 w-4" />
            View on GitHub
          </Link>
        </Button>
        <Button asChild variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {/* repo.full_name is owner/repo */}
          <Link href={`/dashboard/repo/${repo.full_name}`}>
            <EyeIcon className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
