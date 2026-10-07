export const DEFAULT_USERNAME = 'WinTuner';

export const POLL_INTERVAL_MS = 60_000;
export const POLL_INTERVAL_S = 60;

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Rust: '#dea584',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  Shell: '#89e051',
  Docker: '#384d54',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Scala: '#c22d40',
  Makefile: '#427819',
  CMake: '#DA3434',
  Vue: '#41b883',
  React: '#61dafb',
};

export function getLanguageColor(name: string | null): string {
  if (!name) return '#8b949e';
  return LANGUAGE_COLORS[name] ?? '#8b949e';
}
