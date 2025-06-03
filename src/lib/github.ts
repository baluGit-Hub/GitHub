import { Octokit } from 'octokit';
import type { GitHubUser, GitHubRepo } from '@/types/github';

export async function getGitHubUser(accessToken: string): Promise<GitHubUser | null> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data: user } = await octokit.request('GET /user');
    return user as GitHubUser;
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    return null;
  }
}

export async function getGitHubRepos(accessToken: string): Promise<GitHubRepo[]> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data: repos } = await octokit.request('GET /user/repos', {
      type: 'public', // As per request, list public repositories
      sort: 'updated',
      direction: 'desc',
      per_page: 100, // Fetch up to 100 repos
    });
    return repos as GitHubRepo[];
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return [];
  }
}
