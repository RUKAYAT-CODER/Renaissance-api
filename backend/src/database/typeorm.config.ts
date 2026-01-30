import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

<<<<<<< HEAD
export const getTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  // Extraemos la configuración base
  const dbConfig = configService.get<DataSourceOptions>('database');

  // Retornamos el objeto asegurando que las propiedades requeridas existan
=======
export const getTypeOrmConfig = (configService: ConfigService): DataSourceOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  
>>>>>>> b10c2d1f067705bb037b37a020ffb2cab04396e0
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // CRITICAL: Always disable synchronize in production to prevent data loss
    // Schema changes MUST go through migrations only
    synchronize: nodeEnv === 'development',
    logging: nodeEnv === 'development',
    // Auto-run migrations on application startup in production
    migrationsRun: nodeEnv === 'production',
  } as DataSourceOptions;
};

<<<<<<< HEAD
// Exportación para CLI y DataSource manual
export const AppDataSource = (configService: ConfigService) =>
  new DataSource(getTypeOrmConfig(configService));
=======
// Export function for runtime usage in NestJS
export const AppDataSource = (configService: ConfigService) => 
  new DataSource(getTypeOrmConfig(configService));
>>>>>>> b10c2d1f067705bb037b37a020ffb2cab04396e0
