import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsWithdrawableToTransactions1769300000000 implements MigrationInterface {
  name = 'AddIsWithdrawableToTransactions1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "is_withdrawable" boolean DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "is_withdrawable"`,
    );
  }
}
