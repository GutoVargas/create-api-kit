import { AppError } from '../errors/app-error.js';

export interface ItemRecord {
  id: number;
  name: string;
  created_at: Date | string;
}

export class Item {
  private _id: number | null;
  private _name: string;
  private _createdAt: Date | null;

  /** Cria uma entidade e valida os valores iniciais através dos setters. */
  constructor(name: string, id: number | null = null, createdAt: Date | null = null) {
    this._id = id;
    this._name = name;
    this._createdAt = createdAt;
    this.name = name;
    if (id !== null) this.id = id;
    if (createdAt !== null) this.createdAt = createdAt;
  }

  /** Retorna o identificador persistido ou null antes da criação. */
  get id(): number | null { return this._id; }

  /** Define um identificador positivo ou null para uma entidade ainda não persistida. */
  set id(value: number | null) {
    if (value !== null && (!Number.isInteger(value) || value < 1)) {
      throw new AppError('ID do item inválido', 400, 'ERR_VALIDATION');
    }
    this._id = value;
  }

  /** Retorna o nome normalizado do item. */
  get name(): string { return this._name; }

  /** Normaliza e valida o nome do item antes de armazená-lo. */
  set name(value: string) {
    const normalized = value.trim();
    if (!normalized || normalized.length > 120) {
      throw new AppError('O nome deve ter entre 1 e 120 caracteres', 400, 'ERR_VALIDATION');
    }
    this._name = normalized;
  }

  /** Retorna a data de criação ou null antes da persistência. */
  get createdAt(): Date | null { return this._createdAt; }

  /** Define uma data válida de criação ou null para uma entidade nova. */
  set createdAt(value: Date | null) {
    if (value !== null && Number.isNaN(value.getTime())) {
      throw new AppError('Data de criação inválida', 400, 'ERR_VALIDATION');
    }
    this._createdAt = value;
  }

  /** Constrói uma entidade Item a partir de uma linha retornada pelo PostgreSQL. */
  static fromRecord(record: ItemRecord): Item {
    return new Item(record.name, Number(record.id), new Date(record.created_at));
  }

  /** Converte a entidade para o formato JSON público da API. */
  toJSON() {
    return { id: this.id, name: this.name, created_at: this.createdAt?.toISOString() ?? null };
  }
}
