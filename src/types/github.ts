export interface GitHubEventActor {
  login: string;
}

export interface GitHubEventRepo {
  id: number;
  name: string;
  url: string;
}

export interface GitHubEventCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
}

export interface GitHubEventPayload {
  action?: string;
  ref?: string;
  ref_type?: string;
  size?: number;
  distinct_size?: number;
  commits?: GitHubEventCommit[];
  pull_request?: {
    number: number;
    title: string;
  };
  issue?: {
    number: number;
    title: string;
  };
  forkee?: {
    full_name: string;
  };
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: GitHubEventActor;
  repo: GitHubEventRepo;
  payload: GitHubEventPayload;
  created_at: string;
}

export interface Repository {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  size: number;
  updated_at: string;
  topics: string[];
  fork: boolean;
}

export interface Profile {
  avatar_url: string;
  name: string | null;
  login: string;
  bio: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  blog: string | null;
}

export interface PinnedRepo {
  id: string;
  name: string;
  description: string | null;
  url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  language_color: string | null;
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface Contributions {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface RateLimit {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
}

export interface DashboardResponse {
  profile: Profile | null;
  repos: Repository[];
  events: GitHubEvent[];
  pinned: PinnedRepo[];
  contributions: Contributions | null;
  authenticated: boolean;
  rateLimit?: RateLimit | null;
  warnings?: string[];
}
