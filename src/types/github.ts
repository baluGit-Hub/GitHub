export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name?: string | null;
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
  [key: string]: any; // Allow other properties
}
