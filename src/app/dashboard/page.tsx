import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import UserProfileCard from '@/components/dashboard/UserProfileCard';
import RepoCard from '@/components/dashboard/RepoCard';
import { getGitHubUser, getGitHubRepos } from '@/lib/github';
import { AUTH_TOKEN_COOKIE } from '@/lib/constants';
import type { GitHubUser, GitHubRepo } from '@/types/github';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

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
      // Invalid token or error fetching user, clear cookie and redirect
      cookieStore.delete(AUTH_TOKEN_COOKIE); // This might not work as expected in server component, best handled by middleware or client action
      redirect('/?error=auth_failed'); // Redirect to login with error
    }
  } catch (e) {
    console.error("Dashboard data fetching error:", e);
    error = "Failed to load GitHub data. Please try signing out and in again.";
     // Attempt to clear cookie if there's an error related to token
    // This should ideally happen in a client component or API route upon error detection
  }

  if (!user) {
     // This case should be handled by the redirect above or middleware.
     // If somehow execution reaches here without a user, it's an error state.
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


  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader userName={user.name || user.login} userAvatarUrl={user.avatar_url} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <UserProfileCard user={user} />
        </div>

        <h2 className="text-2xl font-headline font-semibold text-foreground mb-6">Your Public Repositories</h2>
        {repos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        ) : (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>No Public Repositories Found</AlertTitle>
            <AlertDescription>
              It seems you don&apos;t have any public repositories, or we couldn&apos;t fetch them.
            </AlertDescription>
          </Alert>
        )}
      </main>
       <footer className="text-center py-6 text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Repo Surfer. Happy surfing!</p>
      </footer>
    </div>
  );
}
