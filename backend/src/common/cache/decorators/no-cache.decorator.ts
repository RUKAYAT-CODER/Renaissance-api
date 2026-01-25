import { SetMetadata } from '@nestjs/common';

export const NO_CACHE_METADATA = 'no_cache_metadata';

export const NoCache = () => SetMetadata(NO_CACHE_METADATA, true);
