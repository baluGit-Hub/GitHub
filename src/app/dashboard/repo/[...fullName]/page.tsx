import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AppHeader from '@/components/layout/AppHeader';
import {
  getGitHubUser,
  getRepoDetails,
  getRecentCommits,
  getRepoTotalCommits,
  getRepoBranches,
  getRepoPullRequestsCount,
  getRepoClosedIssuesCount,
  getRepoLanguages,
  getRepoContributors,
} from '@/lib/github';
import { AUTH_TOKEN_COOKIE } from '@/lib/constants';
import type {
  GitHubUser,
  GitHubRepoDetail,
  GitHubCommit,
  GitHubBranch,
  GitHubLanguages,
  GitHubContributor,
} from '@/types/github';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Star, GitFork, Eye, Users, GitCommit, GitBranch as GitBranchIcon, GitPullRequest, AlertCircle as IssueIcon, ListChecks, CodeIcon as Code, ArrowLeft, ExternalLink, Info, UsersRound, BookText, LanguagesIcon, History
} from "lucide-react"; // Using specific names for icons
import { format, formatDistanceToNow, parseISO } from 'date-fns';

interface RepoDetailPageProps {
  params: {
    fullName: string[]; // [owner, repoName]
  };
}

const DataCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className }) => (
  <Card className={cn("shadow-lg", className)}>
    <CardHeader className="pb-4">
      <CardTitle className="text-xl font-semibold text-primary flex items-center">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);


export default async function RepoDetailPage({ params }: RepoDetailPageProps) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    redirect('/');
  }

  constauthUser = await getGitHubUser(accessToken);
  if (!authUser) {
    // This scenario should ideally be caught by middleware or earlier checks
    cookieStore.delete(AUTH_TOKEN_COOKIE);
    redirect('/?error=auth_failed_repo_detail');
  }

  if (!params.fullName || params.fullName.length < 2) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader userName={authUser.name || authUser.login} userAvatarUrl={authUser.avatar_url} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Invalid repository URL.</AlertDescription>
          </Alert>
           <Button asChild variant="outline" className="mt-4">
             <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
           </Button>
        </main>
      </div>
    );
  }

  const owner = params.fullName[0];
  const repoName = params.fullName.slice(1).join('/'); // Handle repo names with slashes, though GH usually doesn't allow them in that part of URL path.

  // Fetch all data in parallel
  const results = await Promise.allSettled([
    getRepoDetails(accessToken, owner, repoName), // 0
    getRepoTotalCommits(accessToken, owner, repoName), // 1
    getRecentCommits(accessToken, owner, repoName, 5), // 2
    getRepoBranches(accessToken, owner, repoName), // 3
    getRepoPullRequestsCount(accessToken, owner, repoName, 'open'), // 4
    getRepoPullRequestsCount(accessToken, owner, repoName, 'closed'), // 5 (total closed, includes merged)
    getRepoPullRequestsCount(accessToken, owner, repoName, 'merged'), // 6
    getRepoClosedIssuesCount(accessToken, owner, repoName), // 7 (open issues count is in repoDetails)
    getRepoLanguages(accessToken, owner, repoName), // 8
    getRepoContributors(accessToken, owner, repoName), // 9
  ]);

  const getResultValue = <T,>(index: number, defaultValue: T): T => {
    const result = results[index];
    if (result.status === 'fulfilled' && result.value !== null && result.value !== undefined) {
      return result.value as T;
    }
    if (result.status === 'rejected') {
      console.error(`Error fetching data at index ${index}:`, result.reason);
    }
    return defaultValue;
  };

  const repoDetails = getResultValue<GitHubRepoDetail | null>(0, null);
  const totalCommits = getResultValue<number>(1, 0);
  const recentCommits = getResultValue<GitHubCommit[]>(2, []);
  const branches = getResultValue<GitHubBranch[]>(3, []);
  const openPRCount = getResultValue<number>(4, 0);
  const closedPRCount = getResultValue<number>(5, 0); // Total closed (includes merged)
  const mergedPRCount = getResultValue<number>(6, 0);
  const closedIssuesCount = getResultValue<number>(7, 0);
  const languages = getResultValue<GitHubLanguages | null>(8, null);
  const contributors = getResultValue<GitHubContributor[]>(9, []);
  
  const openIssuesCount = repoDetails?.open_issues_count ?? 0;

  if (!repoDetails) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader userName={authUser.name || authUser.login} userAvatarUrl={authUser.avatar_url} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error Fetching Repository</AlertTitle>
            <AlertDescription>Could not fetch details for {owner}/{repoName}. The repository might not exist or there was an API error.</AlertDescription>
          </Alert>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
        </main>
      </div>
    );
  }
  
  const totalPRCount = openPRCount + closedPRCount; // This might double count merged if closedPRCount includes merged.
                                                 // Let's use openPRCount, mergedPRCount, and (closedPRCount - mergedPRCount) for unmerged_closed
  const unmergedClosedPRCount = closedPRCount - mergedPRCount;


  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <AppHeader userName={authUser.name || authUser.login} userAvatarUrl={authUser.avatar_url} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
        </div>

        {/* Repo Header Card */}
        <Card className="mb-8 shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <CardTitle className="text-3xl font-bold text-primary mb-2 sm:mb-0">
                {repoDetails.full_name}
              </CardTitle>
              <Button asChild variant="secondary">
                <Link href={repoDetails.html_url} target="_blank" rel="noopener noreferrer">
                  View on GitHub <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {repoDetails.description && (
              <CardDescription className="text-muted-foreground text-base pt-2">{repoDetails.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center"><Star className="mr-2 h-4 w-4 text-yellow-500" /> {repoDetails.stargazers_count} Stars</div>
            <div className="flex items-center"><GitFork className="mr-2 h-4 w-4 text-blue-500" /> {repoDetails.forks_count} Forks</div>
            <div className="flex items-center"><Eye className="mr-2 h-4 w-4 text-green-500" /> {repoDetails.watchers_count} Watchers</div>
            <div className="flex items-center"><IssueIcon className="mr-2 h-4 w-4 text-orange-500" /> {openIssuesCount} Open Issues</div>
            {repoDetails.language && <div className="flex items-center"><Code className="mr-2 h-4 w-4 text-purple-500" /> {repoDetails.language}</div>}
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
            Created: {format(parseISO(repoDetails.created_at), 'MMM d, yyyy')} &bull; Last push: {formatDistanceToNow(parseISO(repoDetails.pushed_at), { addSuffix: true })}
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Commits & Branches */}
          <div className="lg:col-span-2 space-y-6">
            <DataCard title="Commit Activity" icon={History}>
              <p className="text-muted-foreground mb-1">Total Commits: <span className="font-semibold text-foreground">{totalCommits > 0 ? totalCommits : 'N/A'}</span></p>
              <h3 className="font-semibold text-md my-2">Recent Commits:</h3>
              {recentCommits.length > 0 ? (
                <ul className="space-y-3">
                  {recentCommits.map(commit => (
                    <li key={commit.sha} className="text-sm border-b pb-2 last:border-b-0 last:pb-0">
                      <Link href={commit.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary block truncate">
                        {commit.commit.message.split('\n')[0]}
                      </Link>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        {commit.author?.avatar_url && <Avatar className="h-5 w-5 mr-1.5"><AvatarImage src={commit.author.avatar_url} alt={commit.commit.author?.name || 'author'} /><AvatarFallback>{commit.commit.author?.name?.charAt(0) || 'A'}</AvatarFallback></Avatar> }
                        <span className="font-medium">{commit.commit.author?.name || 'Unknown author'}</span>
                        <span className="mx-1">&bull;</span>
                        {commit.commit.author?.date ? formatDistanceToNow(parseISO(commit.commit.author.date), { addSuffix: true }) : 'N/A'}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm">No recent commits found or unable to fetch.</p>}
            </DataCard>

            <DataCard title="Branches" icon={GitBranchIcon}>
              {branches.length > 0 ? (
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {branches.map(branch => (
                    <li key={branch.name} className="text-sm flex justify-between items-center p-1.5 hover:bg-secondary rounded-md">
                      <span>{branch.name} {branch.name === repoDetails.default_branch && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}</span>
                      {/* <Link href={`${repoDetails.html_url}/tree/${branch.name}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</Link> */}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm">No branches found.</p>}
            </DataCard>
          </div>

          {/* Column 2: PRs, Issues, Languages, Contributors */}
          <div className="space-y-6">
            <DataCard title="Pull Requests" icon={GitPullRequest}>
              <ul className="space-y-1 text-sm">
                <li>Open: <span className="font-semibold">{openPRCount}</span></li>
                <li>Merged: <span className="font-semibold">{mergedPRCount}</span></li>
                <li>Closed (Unmerged): <span className="font-semibold">{Math.max(0, unmergedClosedPRCount)}</span></li>
                <li className="pt-1 mt-1 border-t">Total Closed: <span className="font-semibold">{closedPRCount}</span></li>
              </ul>
            </DataCard>

            <DataCard title="Issues" icon={IssueIcon}>
               <ul className="space-y-1 text-sm">
                <li>Open: <span className="font-semibold">{openIssuesCount}</span></li>
                <li>Closed: <span className="font-semibold">{closedIssuesCount}</span></li>
              </ul>
            </DataCard>
            
            <DataCard title="Languages" icon={LanguagesIcon}>
              {languages && Object.keys(languages).length > 0 ? (
                <ul className="space-y-1">
                  {Object.entries(languages)
                    .sort(([, a], [, b]) => b - a) // Sort by usage
                    .map(([lang, bytes]) => (
                    <li key={lang} className="text-sm">{lang} 
                      {/* Optional: calculate percentage for a simple bar or more info */}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm">Language data not available.</p>}
            </DataCard>

            <DataCard title="Top Contributors" icon={UsersRound}>
              {contributors.length > 0 ? (
                <ul className="space-y-3">
                  {contributors.map(contrib => (
                    <li key={contrib.id} className="flex items-center text-sm">
                       <Avatar className="h-8 w-8 mr-3">
                         <AvatarImage src={contrib.avatar_url} alt={contrib.login} />
                         <AvatarFallback>{contrib.login.charAt(0).toUpperCase()}</AvatarFallback>
                       </Avatar>
                       <div>
                         <Link href={contrib.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-primary">{contrib.login}</Link>
                         <p className="text-xs text-muted-foreground">{contrib.contributions} contributions</p>
                       </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm">No contributor data available.</p>}
            </DataCard>
          </div>
        </div>
      </main>
       <footer className="text-center py-6 text-sm text-muted-foreground border-t mt-8">
        <p>&copy; {new Date().getFullYear()} Repo Surfer. Happy surfing!</p>
      </footer>
    </div>
  );
}
