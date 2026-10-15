import type { PoolClient } from 'pg';
import { getClient } from '../databases/postgres.js';
import { AppError } from '../errors/app-error.js';
import { Item } from '../models/item.js';
import { ItemRepository } from '../repositories/item-repository.js';

/** Ignora falha secundária do ROLLBACK para preservar o erro original da operação. */
function ignoreRollbackError(): undefined { return undefined; }

export class ItemService {
  /** Recebe o repository usado para persistir e consultar itens. */
  constructor(private readonly itemRepository: ItemRepository) {}

  /** Retorna todos os itens registrados. */
  list(): Promise<Item[]> {
    return this.itemRepository.findAll();
  }

  /** Busca um item e lança erro de aplicação quando o ID não existe. */
  async get(id: number): Promise<Item> {
    const item = await this.itemRepository.findById(id);
    if (!item) throw new AppError('Item não encontrado', 404, 'ERR_NOT_FOUND');
    return item;
  }

  /** Cria um item dentro de uma transação PostgreSQL. */
  create(name: string): Promise<Item> {
    const repository = this.itemRepository;
    /** Insere a nova entidade usando o cliente aberto pela transação. */
    async function insertItem(client: PoolClient): Promise<Item> {
      return repository.insert(client, new Item(name));
    }
    return this.withTransaction(insertItem);
  }

  /** Atualiza o nome de um item em transação e informa quando ele não existe. */
  async update(id: number, name: string): Promise<Item> {
    const repository = this.itemRepository;
    /** Executa a atualização usando a conexão aberta pela transação. */
    async function updateItem(client: PoolClient): Promise<Item | null> {
      return repository.update(client, id, new Item(name));
    }
    const item = await this.withTransaction(updateItem);
    if (!item) throw new AppError('Item não encontrado', 404, 'ERR_NOT_FOUND');
    return item;
  }

  /** Remove um item em transação e lança erro se nenhuma linha for removida. */
  async delete(id: number): Promise<void> {
    const repository = this.itemRepository;
    /** Executa a remoção usando a conexão aberta pela transação. */
    async function deleteItem(client: PoolClient): Promise<boolean> {
      return repository.delete(client, id);
    }
    const deleted = await this.withTransaction(deleteItem);
    if (!deleted) throw new AppError('Item não encontrado', 404, 'ERR_NOT_FOUND');
  }

  /** Abre uma transação, confirma o resultado ou desfaz alterações e libera o cliente. */
  private async withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(ignoreRollbackError);
      throw error;
    } finally {
      client.release();
    }
  }
}
