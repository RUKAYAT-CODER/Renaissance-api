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
} from '@nestjs/common';
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

@Controller('posts')
@UseGuards(JwtAuthGuard)
@UseInterceptors(HttpCacheInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Create a new post
   * POST /posts
   */
  @Post()
  @NoCache()
  async createPost(
    @Req() req: AuthenticatedRequest,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.create(req.user.userId, createPostDto);
  }

  /**
   * Get a specific post by ID
   * GET /posts/:id
   */
  @Get(':id')
  @CacheKey('posts-single')
  @UseGuards(OwnershipGuard({ entity: PostEntity, ownerField: 'author' }))
  async getPostById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  /**
   * Update a post (owner only)
   * PATCH /posts/:id
   */
  @Patch(':id')
  @NoCache()
  @UseGuards(OwnershipGuard({ entity: PostEntity, ownerField: 'author' }))
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.update(id, req.user.userId, updatePostDto);
  }

  /**
   * Delete a post (owner only)
   * DELETE /posts/:id
   */
  @Delete(':id')
  @NoCache()
  @UseGuards(OwnershipGuard({ entity: PostEntity, ownerField: 'author' }))
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.postsService.delete(id, req.user.userId);
  }

  /**
   * Get all published posts (public)
   * GET /posts
   */
  @Get()
  @CacheKey('posts')
  async getPublishedPosts(): Promise<PostEntity[]> {
    return this.postsService.findPublished();
  }
}
