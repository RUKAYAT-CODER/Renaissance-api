import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './src/database/typeorm.config';
import configuration from './src/config/configuration';

const configService = new ConfigService(configuration());

export const AppDataSource = new DataSource(getTypeOrmConfig(configService));