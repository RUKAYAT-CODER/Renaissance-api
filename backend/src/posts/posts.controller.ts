import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Req,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { HttpCacheInterceptor } from '../common/cache/interceptors/http-cache.interceptor';
import { CacheKey } from '../common/cache/decorators/cache-key.decorator';
import { NoCache } from '../common/cache/decorators/no-cache.decorator';
import { Request } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { UserRole } from '../users/entities/user.entity';
import { Post as PostEntity } from './entities/post.entity';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UseInterceptors(HttpCacheInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @NoCache()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new post',
    description: 'Creates a new blog post or article. User becomes the author.',
  })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({
    status: 201,
    description: 'Post successfully created',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Top 10 Betting Strategies',
        content: 'In this guide...',
        slug: 'top-10-betting-strategies',
        status: 'published',
        authorId: '456e7890-e12b-34d5-a678-901234567890',
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async createPost(
    @Req() req: AuthenticatedRequest,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.create(req.user.userId, createPostDto);
  }

  @Get()
  @CacheKey('posts')
  @ApiOperation({
    summary: 'Get all published posts',
    description:
      'Retrieves a list of all published posts. Only shows posts with status "published".',
  })
  @ApiResponse({
    status: 200,
    description: 'Published posts retrieved successfully',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Top 10 Betting Strategies',
          excerpt: 'Learn essential betting strategies...',
          slug: 'top-10-betting-strategies',
          featuredImage: 'https://example.com/image.jpg',
          status: 'published',
          type: 'article',
          tags: ['betting', 'strategies'],
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async getPublishedPosts(): Promise<PostEntity[]> {
    return this.postsService.findPublished();
  }

  @Get(':id')
  @CacheKey('posts-single')
  @UseGuards(OwnershipGuard({ entity: PostEntity, ownerField: 'author' }))
  @ApiOperation({
    summary: 'Get a specific post by ID',
    description:
      'Retrieves detailed information about a post. User can only access their own posts unless admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'Post UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Post found',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Top 10 Betting Strategies',
        content: 'Full content here...',
        excerpt: 'Learn essential betting strategies...',
        slug: 'top-10-betting-strategies',
        featuredImage: 'https://example.com/image.jpg',
        status: 'published',
        type: 'article',
        tags: ['betting', 'strategies'],
        metadata: { readingTime: '5 min' },
        authorId: '456e7890-e12b-34d5-a678-901234567890',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only access own posts',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getPostById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @NoCache()
  @UseGuards(OwnershipGuard({ entity: PostEntity, ownerField: 'author' }))
  @ApiOperation({
    summary: 'Update a post (Owner only)',
    description:
      'Updates an existing post. User can only update their own posts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Post UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({
    status: 200,
    description: 'Post successfully updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own posts',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.update(id, req.user.userId, updatePostDto);
  }

  @Delete(':id')
  @NoCache()
  @UseGuards(OwnershipGuard({ entity: PostEntity, ownerField: 'author' }))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a post (Owner only)',
    description:
      'Permanently deletes a post. User can only delete their own posts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Post UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Post successfully deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own posts',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.postsService.delete(id, req.user.userId);
  }
}
