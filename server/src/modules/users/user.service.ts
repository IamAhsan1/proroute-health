import { AppError } from '../../middleware/error.middleware.js';
import { authService } from '../auth/auth.service.js';
import { UserResponseDto } from '../auth/auth.types.js';
import { UserRepository, userRepository } from './user.repository.js';
import { UpdateProfileInput } from './user.types.js';

export class UserService {
  constructor(private repo: UserRepository = userRepository) {}

  public async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.repo.findProfileByUserId(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return authService.formatUserResponse(user);
  }

  public async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserResponseDto> {
    const updatedUser = await this.repo.updateProfile(userId, data);
    return authService.formatUserResponse(updatedUser);
  }
}

export const userService = new UserService();
