import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe123',
    required: false,
  })
  username?: string;

  @ApiProperty({ description: 'First name', example: 'John', required: false })
  firstName?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe', required: false })
  lastName?: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T15:45:00Z',
  })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'User information (excluding sensitive data)',
    type: UserResponseDto,
  })
  user: Omit<User, 'password' | 'posts' | 'comments'>;

  @ApiProperty({
    description: 'JWT access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}
