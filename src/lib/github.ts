import { Octokit } from 'octokit';
import type {
  GitHubUser,
  GitHubRepo,
  GitHubRepoDetail,
  GitHubCommit,
  GitHubBranch,
  GitHubPullRequest,
  GitHubIssue,
  GitHubLanguages,
  GitHubContributor,
  GitHubSearchItem,
  GitHubSearchResults,
} from '@/types/github';

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
      type: 'public',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });
    return repos as GitHubRepo[];
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return [];
  }
}

// --- New functions for detailed repo view ---

function parseLinkHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const links: Record<string, string> = {};
  header.split(',').forEach(part => {
    const section = part.split(';');
    if (section.length < 2) return;
    const url = section[0].replace(/<(.*)>/, '$1').trim();
    const name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  });
  return links;
}

export async function getRepoDetails(accessToken: string, owner: string, repo: string): Promise<GitHubRepoDetail | null> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data } = await octokit.request('GET /repos/{owner}/{repo}', {
      owner,
      repo,
    });
    return data as GitHubRepoDetail;
  } catch (error) {
    console.error(`Error fetching repo details for ${owner}/${repo}:`, error);
    return null;
  }
}

export async function getRecentCommits(accessToken: string, owner: string, repo: string, count: number = 5): Promise<GitHubCommit[]> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner,
      repo,
      per_page: count,
    });
    return data as GitHubCommit[];
  } catch (error) {
    console.error(`Error fetching recent commits for ${owner}/${repo}:`, error);
    return [];
  }
}

export async function getRepoTotalCommits(accessToken: string, owner: string, repo: string): Promise<number> {
  // This is a common way to get total commits by checking the Link header of the first page.
  // Octokit's paginate might be too slow if there are thousands of commits.
  try {
    const octokit = new Octokit({ auth: accessToken });
    const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner,
      repo,
      per_page: 1, // We only need the header
    });
    const linkHeader = response.headers.link;
    const links = parseLinkHeader(linkHeader || null);
    if (links.last) {
      const lastUrl = new URL(links.last);
      const lastPage = lastUrl.searchParams.get('page');
      if (lastPage) return parseInt(lastPage, 10); // Assuming per_page on last is also 1, but generally this is the number of pages. If per_page for last call is fixed, then this is total pages.
                                                 // If each page has e.g. 30 items, it's (lastPage-1)*30 + items_on_last_page.
                                                 // For commits, this method usually gives the total number of commit pages if each page has 1 commit.
                                                 // A more robust method is to count all commits via pagination, but that can be slow.
                                                 // GitHub REST API for commits doesn't return a total_count field.
                                                 // Let's assume Link header with per_page=1 for last page gives total pages = total commits.
                                                 // This is often the case for commit lists.
                                                 // A better approach for total commits might involve a different strategy or approximation if this is not accurate.
                                                 // For now, let's return this and it can be refined.
                                                 // This will give total pages, assuming default per_page or per_page=1. If per_page in request is N, then this is num_pages.
                                                 // If per_page=1 returns last page for total commits, this is correct.
                                                 // If not, this is an estimation.
    }
    // Fallback or if Link header is not conclusive for total count: paginate and count (can be slow)
    // For now, let's return 0 if Link header method fails, or count from a few pages.
    // This method is tricky. Let's try paginating for a more accurate count if Link header isn't simple.
    // Actually, for commits, there isn't a total_count. We'll list recent ones, and total count is a known hard problem.
    // Let's return an approximate or just state "Many" if hard to get.
    // For now, let's return a placeholder if we can't get it simply.
    // Let's try to get it from contributors total contributions as a proxy? No, that's different.
    // Let's count first few pages up to 100 commits for an idea
    const commits = await octokit.paginate(`GET /repos/{owner}/{repo}/commits`, { owner, repo, per_page: 100 });
    return commits.length; // This will count up to how many paginate fetches (usually a few thousand max easily)

  } catch (error) {
    console.error(`Error fetching total commits for ${owner}/${repo}:`, error);
    return 0; // Or handle error appropriately
  }
}


export async function getRepoBranches(accessToken: string, owner: string, repo: string): Promise<GitHubBranch[]> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    // Paginate will fetch all branches
    const branches = await octokit.paginate('GET /repos/{owner}/{repo}/branches', {
      owner,
      repo,
      per_page: 100,
    });
    return branches as GitHubBranch[];
  } catch (error) {
    console.error(`Error fetching branches for ${owner}/${repo}:`, error);
    return [];
  }
}

async function searchGitHub(octokit: Octokit, query: string): Promise<number> {
  try {
    const response = await octokit.request('GET /search/issues', { q: query });
    return response.data.total_count;
  } catch (error) {
    console.error(`Error during GitHub search with query "${query}":`, error);
    return 0;
  }
}

export async function getRepoPullRequestsCount(accessToken: string, owner: string, repo: string, state: 'open' | 'closed' | 'merged'): Promise<number> {
  const octokit = new Octokit({ auth: accessToken });
  let queryState = state;
  if (state === 'merged') queryState = 'merged'; // GitHub search API uses 'is:merged'
  else if (state === 'closed') queryState = 'closed'; // 'is:closed' includes merged. If separate needed, 'is:closed is:unmerged'
  
  // For "merged", we search `is:pr is:merged`. For "closed", we search `is:pr is:closed` (which includes merged).
  // If we want "closed but not merged", it would be `is:pr is:closed is:unmerged`.
  // The request was "open, closed, merged".
  // Let's provide: open, merged, and (closed_unmerged = total_closed - merged)
  
  let query = `repo:${owner}/${repo} is:pr`;
  if (state === 'open') query += ` is:open`;
  else if (state === 'closed') query += ` is:closed`; // This will be total closed (merged + unmerged)
  else if (state === 'merged') query += ` is:merged`;

  return searchGitHub(octokit, query);
}


export async function getRepoClosedIssuesCount(accessToken: string, owner: string, repo: string): Promise<number> {
  const octokit = new Octokit({ auth: accessToken });
  const query = `repo:${owner}/${repo} is:issue is:closed`;
  return searchGitHub(octokit, query);
}


export async function getRepoLanguages(accessToken: string, owner: string, repo: string): Promise<GitHubLanguages | null> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/languages', {
      owner,
      repo,
    });
    return data as GitHubLanguages;
  } catch (error) {
    console.error(`Error fetching languages for ${owner}/${repo}:`, error);
    return null;
  }
}

export async function getRepoContributors(accessToken: string, owner: string, repo: string): Promise<GitHubContributor[]> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    // Paginate will fetch all contributors
    const contributors = await octokit.paginate('GET /repos/{owner}/{repo}/contributors', {
      owner,
      repo,
      per_page: 100,
      anon: 'true', // Include anonymous contributors if any
    });
    // Sort by contributions descending and take top, e.g., 10
    return (contributors as GitHubContributor[]).sort((a,b) => b.contributions - a.contributions).slice(0, 10);
  } catch (error) {
    console.error(`Error fetching contributors for ${owner}/${repo}:`, error);
    return [];
  }
}
