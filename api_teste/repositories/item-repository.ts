import type { PoolClient } from 'pg';
import { pool } from '../databases/postgres.js';
import { Item, type ItemRecord } from '../models/item.js';

export class ItemRepository {
  /** Busca todas as entidades Item ordenadas por identificador. */
  async findAll(): Promise<Item[]> {
    const result = await pool.query<ItemRecord>(
      'SELECT id, name, created_at FROM items ORDER BY id',
    );
    return result.rows.map(Item.fromRecord);
  }

  /** Busca um item pelo ID e retorna null quando ele não existe. */
  async findById(id: number): Promise<Item | null> {
    const result = await pool.query<ItemRecord>(
      'SELECT id, name, created_at FROM items WHERE id = $1', [id],
    );
    return result.rows[0] ? Item.fromRecord(result.rows[0]) : null;
  }

  /** Insere um item usando a conexão transacional fornecida. */
  async insert(client: PoolClient, item: Item): Promise<Item> {
    const result = await client.query<ItemRecord>(
      'INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at', [item.name],
    );
    return Item.fromRecord(result.rows[0]!);
  }

  /** Atualiza o nome de um item dentro da transação fornecida. */
  async update(client: PoolClient, id: number, item: Item): Promise<Item | null> {
    const result = await client.query<ItemRecord>(
      'UPDATE items SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
      [item.name, id],
    );
    return result.rows[0] ? Item.fromRecord(result.rows[0]) : null;
  }

  /** Exclui um item e informa se uma linha foi removida. */
  async delete(client: PoolClient, id: number): Promise<boolean> {
    const result = await client.query('DELETE FROM items WHERE id = $1 RETURNING id', [id]);
    return result.rowCount === 1;
  }
}
