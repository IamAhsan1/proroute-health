import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authRepository } from '../auth.repository.js';
import { prisma } from '../../../lib/prisma.js';

describe('Refresh Token Retention & Cleanup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should call prisma.refreshToken.deleteMany with cutoff date filter', async () => {
    const deleteManySpy = vi
      .spyOn(prisma.refreshToken, 'deleteMany')
      .mockResolvedValue({ count: 42 });

    const result = await authRepository.purgeExpiredRefreshTokens(30);

    expect(result.count).toBe(42);
    expect(deleteManySpy).toHaveBeenCalledOnce();
    const args = deleteManySpy.mock.calls[0][0];
    expect(args?.where?.OR).toBeDefined();
    expect(args?.where?.OR?.length).toBe(2);
  });
});
