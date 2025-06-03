export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name?: string | null;
  html_url?: string;
  [key: string]: any; // Allow other properties
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language?: string | null;
  private: boolean;
  owner: { // Add owner object which is part of repo data
    login: string;
    avatar_url?: string;
  };
  [key: string]: any; // Allow other properties
}

export interface GitHubRepoDetail extends GitHubRepo {
  watchers_count: number;
  open_issues_count: number;
  subscribers_count?: number; // Often same as watchers
  network_count?: number; // Number of forks
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubCommitAuthor {
  name?: string | null;
  email?: string | null;
  date?: string | null;
}

export interface GitHubCommitInfo {
  author: GitHubCommitAuthor;
  committer: GitHubCommitAuthor;
  message: string;
  tree: {
    sha: string;
    url: string;
  };
  url: string;
  comment_count: number;
}

export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: GitHubCommitInfo;
  url: string;
  html_url: string;
  comments_url: string;
  author: GitHubUser | null; // GitHub user object if available
  committer: GitHubUser | null; // GitHub user object if available
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubPullRequest {
  id: number;
  html_url: string;
  number: number;
  title: string;
  user: GitHubUser | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  merged_at?: string | null;
  body?: string | null;
}

export interface GitHubIssue {
  id: number;
  html_url: string;
  number: number;
  title: string;
  user: GitHubUser | null;
  state: 'open' | 'closed';
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  body?: string | null;
}

export interface GitHubLanguages {
  [language: string]: number; // Language name and bytes of code
}

export interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string; // "User" or "Bot"
}

// For search results (PRs, Issues)
export interface GitHubSearchItem {
    id: number;
    html_url: string;
    number: number;
    title: string;
    user: GitHubUser | null;
    state: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    closed_at?: string | null;
    merged_at?: string | null; // For PRs
    body?: string | null;
    pull_request?: object; // Indicates it's a PR if present
    repository_url: string;
}

export interface GitHubSearchResults<T> {
    total_count: number;
    incomplete_results: boolean;
    items: T[];
}
