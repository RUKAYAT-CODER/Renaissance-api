# Ownership Guard

A reusable, configurable guard that enforces ownership-based authorization for user-owned resources in the Renaissance API.

## Purpose

Prevents horizontal privilege escalation by ensuring authenticated users can only access, modify, or delete resources they personally own, unless they have elevated roles (e.g., ADMIN).

## Features

- ✅ Configurable entity and owner field support
- ✅ Admin bypass capability
- ✅ Proper HTTP error handling (404/403)
- ✅ Compatible with TypeORM repositories
- ✅ Works alongside existing JwtAuthGuard and RolesGuard
- ✅ Prevents resource existence leakage across users

## Usage

### Basic Usage

```typescript
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { Bet } from '../bets/entities/bet.entity';
import { Post } from '../posts/entities/post.entity';

// For entities with direct userId field (like Bet)
@UseGuards(OwnershipGuard({ entity: Bet, ownerField: 'userId' }))
@Get(':id')
async getBet(@Param('id') id: string) {
  return this.betsService.findOne(id);
}

// For entities with relationship-based ownership (like Post.author)
@UseGuards(OwnershipGuard({ entity: Post, ownerField: 'author' }))
@Patch(':id')
async updatePost(@Param('id') id: string, @Body() updateDto: UpdatePostDto) {
  return this.postsService.update(id, updateDto);
}
```

### Configuration Options

```typescript
interface OwnershipGuardOptions {
  entity: any;              // TypeORM entity class
  ownerField?: string;      // Field name containing owner ID (default: 'userId')
  resourceIdParam?: string; // Route parameter name (default: 'id')
  adminBypass?: boolean;    // Allow admin bypass (default: true)
}
```

### Examples

#### 1. Direct Field Ownership (userId)

```typescript
// Bet entity has userId field
@Entity('bets')
export class Bet extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;
  
  // ... other fields
}

// Usage
@UseGuards(OwnershipGuard({ 
  entity: Bet, 
  ownerField: 'userId' 
}))
```

#### 2. Relationship-based Ownership (author)

```typescript
// Post entity has author relationship
@Entity('posts')
export class Post extends BaseEntity {
  @ManyToOne(() => User, (user) => user.posts)
  author: User;
  
  // ... other fields
}

// Usage
@UseGuards(OwnershipGuard({ 
  entity: Post, 
  ownerField: 'author' 
}))
```

#### 3. Custom Resource Parameter

```typescript
// If your route uses a different parameter name
@Get('comments/:commentId')
@UseGuards(OwnershipGuard({ 
  entity: Comment, 
  ownerField: 'userId',
  resourceIdParam: 'commentId' 
}))
async getComment(@Param('commentId') commentId: string) {
  return this.commentsService.findOne(commentId);
}
```

#### 4. Disable Admin Bypass

```typescript
// For resources that should not be accessible even by admins
@UseGuards(OwnershipGuard({ 
  entity: PersonalData, 
  ownerField: 'userId',
  adminBypass: false 
}))
```

## Security Behavior

### Access Allowed

- ✅ Authenticated user owns the resource
- ✅ Admin user accessing any resource (when adminBypass: true)

### Access Blocked

- ❌ Resource does not exist → 404 Not Found
- ❌ User not authenticated → 403 Forbidden
- ❌ User does not own resource → 403 Forbidden
- ❌ Resource ownership cannot be determined → 403 Forbidden

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied: You do not own this resource",
  "error": "Forbidden"
}
```

## Integration with Other Guards

The ownership guard works seamlessly with other guards:

```typescript
@Controller('bets')
@UseGuards(JwtAuthGuard) // Applied to all endpoints
export class BetsController {
  
  @Get(':id')
  @UseGuards(
    OwnershipGuard({ entity: Bet, ownerField: 'userId' }),
    RolesGuard // Optional: Add role restrictions
  )
  @Roles(UserRole.USER, UserRole.MODERATOR)
  async getBet(@Param('id') id: string) {
    return this.betsService.findOne(id);
  }
}
```

## Implementation Notes

- The guard extracts the authenticated user ID from the JWT payload
- Resource ID is extracted from route parameters
- Ownership is verified via TypeORM repository lookup
- The retrieved resource is attached to the request object for potential use in controllers
- Repository resolution uses NestJS dependency injection with naming convention: `${EntityName}Repository`

## Testing

Comprehensive test coverage is provided in `ownership.guard.spec.ts` covering:

- ✅ Owner access validation
- ✅ Admin bypass functionality
- ✅ Cross-user access blocking
- ✅ Resource not found handling
- ✅ Authentication requirement validation
- ✅ Edge cases and error conditions

Run tests with:
```bash
npm test -- ownership.guard.spec.ts
```
