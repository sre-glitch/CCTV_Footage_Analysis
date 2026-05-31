import type { PrismaClient } from "@prisma/client";
import type { PosTransaction } from "@store/shared";

export class PosRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByStore(storeId: string): Promise<PosTransaction[]> {
    const rows = await this.db.posTransaction.findMany({ where: { store_id: storeId }, orderBy: { timestamp: "asc" } });
    return rows.map((row) => ({
      store_id: row.store_id,
      transaction_id: row.transaction_id,
      timestamp: row.timestamp.toISOString(),
      basket_value: row.basket_value
    }));
  }
}
