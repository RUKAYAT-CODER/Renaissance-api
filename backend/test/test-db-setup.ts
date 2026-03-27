import { DataSource } from 'typeorm';
import { Player } from '../src/players/entities/player.entity';

export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [Player],
    synchronize: true,
    dropSchema: true,
  });

  await dataSource.initialize();
  return dataSource;
}
