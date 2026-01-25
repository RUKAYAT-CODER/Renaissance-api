import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CacheInvalidationService } from '../common/cache/cache-invalidation.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly cacheInvalidationService: CacheInvalidationService,
  ) {}

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      author: { id: userId } as any,
    });
    const savedPost = await this.postRepository.save(post);
    await this.cacheInvalidationService.invalidatePattern('posts*');
    return savedPost;
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'categories'],
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async update(
    id: string,
    userId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.findOne(id);
    Object.assign(post, updatePostDto);
    const savedPost = await this.postRepository.save(post);
    await this.cacheInvalidationService.invalidatePattern('posts*');
    return savedPost;
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
    await this.cacheInvalidationService.invalidatePattern('posts*');
  }

  async findPublished(): Promise<Post[]> {
    return this.postRepository.find({
      where: { status: PostStatus.PUBLISHED },
      relations: ['author', 'categories'],
      order: { createdAt: 'DESC' as any },
    });
  }
}
