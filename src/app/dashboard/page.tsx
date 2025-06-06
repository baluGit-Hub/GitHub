
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import UserProfileCard from '@/components/dashboard/UserProfileCard';
import RepoCard from '@/components/dashboard/RepoCard';
import { getGitHubUser, getGitHubRepos } from '@/lib/github';
import { AUTH_TOKEN_COOKIE } from '@/lib/constants';
import type { GitHubUser, GitHubRepo } from '@/types/github';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Terminal,
  LibraryBig,
  Star,
  Zap,
  GitFork,
  BarChartHorizontalBig,
  GitPullRequestArrow,
  FileWarning,
  Users,
  Languages,
  Lightbulb,
  InfoIcon
} from "lucide-react";

const MAX_DISPLAY_ITEMS = 6;

export default async function DashboardPage() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    redirect('/');
  }

  let user: GitHubUser | null = null;
  let repos: GitHubRepo[] = [];
  let error: string | null = null;

  try {
    user = await getGitHubUser(accessToken);
    if (user) {
      repos = await getGitHubRepos(accessToken);
    } else {
      cookieStore.delete(AUTH_TOKEN_COOKIE);
      redirect('/?error=auth_failed');
    }
  } catch (e) {
    console.error("Dashboard data fetching error:", e);
    error = "Failed to load GitHub data. Please try signing out and in again.";
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              Could not fetch user data. You might be redirected to login.
              If the problem persists, please try clearing your cookies.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader userName={user?.name || user?.login} userAvatarUrl={user?.avatar_url} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const topStarredRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, MAX_DISPLAY_ITEMS);
  const mostActiveRepos = [...repos].sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()).slice(0, MAX_DISPLAY_ITEMS);
  const mostForkedRepos = [...repos].sort((a, b) => b.forks_count - a.forks_count).slice(0, MAX_DISPLAY_ITEMS);

  const renderRepoGrid = (repoList: GitHubRepo[], emptyMessage: string) => {
    if (repoList.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repoList.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      );
    }
    return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>{emptyMessage}</AlertTitle>
        <AlertDescription>
          It seems you don&apos;t have any matching repositories, or we couldn&apos;t fetch them.
        </AlertDescription>
      </Alert>
    );
  };

  const PlaceholderContent = ({ tabName }: { tabName: string }) => (
    <Alert variant="default" className="mt-6">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>{tabName} - Coming Soon!</AlertTitle>
      <AlertDescription>
        This section is under development. Check back later for {tabName.toLowerCase()} details.
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader userName={user.name || user.login} userAvatarUrl={user.avatar_url} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <UserProfileCard user={user} />
        </div>

        <Tabs defaultValue="repositories" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <TabsList className="px-2 py-1 h-auto">
              <TabsTrigger value="repositories" className="px-3 py-1.5 text-sm">
                <LibraryBig className="mr-2 h-4 w-4" /> Repositories
              </TabsTrigger>
              <TabsTrigger value="top_starred" className="px-3 py-1.5 text-sm">
                <Star className="mr-2 h-4 w-4" /> Top Starred
              </TabsTrigger>
              <TabsTrigger value="most_active" className="px-3 py-1.5 text-sm">
                <Zap className="mr-2 h-4 w-4" /> Most Active
              </TabsTrigger>
              <TabsTrigger value="most_forked" className="px-3 py-1.5 text-sm">
                <GitFork className="mr-2 h-4 w-4" /> Most Forked
              </TabsTrigger>
              <TabsTrigger value="commit_activity" className="px-3 py-1.5 text-sm">
                <BarChartHorizontalBig className="mr-2 h-4 w-4" /> Commit Activity
              </TabsTrigger>
              <TabsTrigger value="pull_requests" className="px-3 py-1.5 text-sm">
                <GitPullRequestArrow className="mr-2 h-4 w-4" /> Pull Requests
              </TabsTrigger>
              <TabsTrigger value="issues" className="px-3 py-1.5 text-sm">
                <FileWarning className="mr-2 h-4 w-4" /> Issues
              </TabsTrigger>
              <TabsTrigger value="organizations" className="px-3 py-1.5 text-sm">
                <Users className="mr-2 h-4 w-4" /> Organizations
              </TabsTrigger>
              <TabsTrigger value="language_distribution" className="px-3 py-1.5 text-sm">
                <Languages className="mr-2 h-4 w-4" /> Languages
              </TabsTrigger>
              <TabsTrigger value="repository_insights" className="px-3 py-1.5 text-sm">
                <Lightbulb className="mr-2 h-4 w-4" /> Insights
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="repositories" className="mt-6">
            <h2 className="text-2xl font-headline font-semibold text-foreground mb-6">Your Public Repositories ({repos.length})</h2>
            {renderRepoGrid(repos, "No Public Repositories Found")}
          </TabsContent>
          <TabsContent value="top_starred" className="mt-6">
            <h2 className="text-2xl font-headline font-semibold text-foreground mb-6">Top Starred Repositories</h2>
            {renderRepoGrid(topStarredRepos, "No starred repositories to display")}
          </TabsContent>
          <TabsContent value="most_active" className="mt-6">
            <h2 className="text-2xl font-headline font-semibold text-foreground mb-6">Most Active Repositories</h2>
            {renderRepoGrid(mostActiveRepos, "No active repositories to display")}
          </TabsContent>
          <TabsContent value="most_forked" className="mt-6">
            <h2 className="text-2xl font-headline font-semibold text-foreground mb-6">Most Forked Repositories</h2>
            {renderRepoGrid(mostForkedRepos, "No forked repositories to display")}
          </TabsContent>
          
          <TabsContent value="commit_activity" className="mt-6">
            <PlaceholderContent tabName="Commit Activity" />
          </TabsContent>
          <TabsContent value="pull_requests" className="mt-6">
            <PlaceholderContent tabName="Pull Requests" />
          </TabsContent>
          <TabsContent value="issues" className="mt-6">
            <PlaceholderContent tabName="Issues" />
          </TabsContent>
          <TabsContent value="organizations" className="mt-6">
            <PlaceholderContent tabName="Organizations" />
          </TabsContent>
          <TabsContent value="language_distribution" className="mt-6">
            <PlaceholderContent tabName="Language Distribution" />
          </TabsContent>
          <TabsContent value="repository_insights" className="mt-6">
            <PlaceholderContent tabName="Repository Insights" />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground border-t mt-8">
        <p>&copy; {new Date().getFullYear()} Repo Surfer. Happy surfing!</p>
      </footer>
    </div>
  );
}

    