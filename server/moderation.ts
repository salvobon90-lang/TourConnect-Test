const userPostCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userData = userPostCounts.get(userId);

  if (!userData || now > userData.resetAt) {
    userPostCounts.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userData.count >= limit) {
    return false;
  }

  userData.count++;
  return true;
}
