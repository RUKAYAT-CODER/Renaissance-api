import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateFreeBetVouchers004 implements MigrationInterface {
  name = 'CreateFreeBetVouchers004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'free_bet_vouchers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 18,
            scale: 8,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'used_for_bet_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'free_bet_vouchers',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_free_bet_vouchers_user_id',
      }),
    );

    await queryRunner.createIndex(
      'free_bet_vouchers',
      new TableIndex({
        name: 'IDX_free_bet_vouchers_user_used',
        columnNames: ['user_id', 'used'],
      }),
    );
    await queryRunner.createIndex(
      'free_bet_vouchers',
      new TableIndex({
        name: 'IDX_free_bet_vouchers_expires_at',
        columnNames: ['expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'free_bet_vouchers',
      'IDX_free_bet_vouchers_expires_at',
    );
    await queryRunner.dropIndex(
      'free_bet_vouchers',
      'IDX_free_bet_vouchers_user_used',
    );
    await queryRunner.dropForeignKey(
      'free_bet_vouchers',
      'FK_free_bet_vouchers_user_id',
    );
    await queryRunner.dropTable('free_bet_vouchers');
  }
}
