import argon2 from 'argon2';

export class Argon2Service {
  /**
   * Hashes plain text password using Argon2id with OWASP-recommended parameters
   */
  public static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verifies plain text password against stored Argon2id hash
   */
  public static async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch (err) {
      return false;
    }
  }
}
