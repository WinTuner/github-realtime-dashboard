export function formatSizeKB(totalSizeKB: number): string {
  if (totalSizeKB > 1024 * 1024) {
    return `${(totalSizeKB / (1024 * 1024)).toFixed(2)} GB`;
  }
  return `${(totalSizeKB / 1024).toFixed(1)} MB`;
}

export function formatRepoSizeKB(sizeKB: number): string {
  return sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB}KB`;
}

export function stripRepoPrefix(fullName: string, username: string): string {
  const prefix = `${username}/`;
  if (fullName.toLowerCase().startsWith(prefix.toLowerCase())) {
    return fullName.slice(prefix.length);
  }
  return fullName;
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function getContributionColor(count: number): string {
  if (count <= 0) return 'rgba(255, 255, 255, 0.06)';
  if (count <= 3) return 'var(--contrib-1)';
  if (count <= 6) return 'var(--contrib-2)';
  if (count <= 9) return 'var(--contrib-3)';
  return 'var(--contrib-4)';
}

export function normalizeBlogUrl(blog: string): string {
  return blog.startsWith('http') ? blog : `https://${blog}`;
}
