import type { NextFunction, Request, Response } from 'express';
import type { CreateItemInput, ItemIdParams } from '../schemas/item-schemas.js';
import { ItemService } from '../services/item-service.js';

interface ValidatedLocals {
  validated: { body?: CreateItemInput; params?: ItemIdParams };
}

export class ItemController {
  /** Recebe o serviço que implementa as operações do recurso Item. */
  constructor(private readonly itemService: ItemService) {}

  /** Lista itens e converte as entidades para o contrato JSON da API. */
  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.itemService.list();
      const data = [];
      for (const item of items) data.push(item.toJSON());
      res.json({ data });
    } catch (error) { next(error); }
  };

  /** Busca um item pelo ID validado e responde com 404 se não existir. */
  get = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = (res.locals as unknown as ValidatedLocals).validated.params!;
      const item = await this.itemService.get(id);
      res.json({ data: item.toJSON() });
    } catch (error) { next(error); }
  };

  /** Cria um item com os dados validados e responde com status 201. */
  create = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = (res.locals as unknown as ValidatedLocals).validated.body!;
      const item = await this.itemService.create(name);
      res.status(201).json({ data: item.toJSON() });
    } catch (error) { next(error); }
  };

  /** Atualiza um item existente usando o ID e o corpo já validados. */
  update = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = (res.locals as unknown as ValidatedLocals).validated.params!;
      const { name } = (res.locals as unknown as ValidatedLocals).validated.body!;
      const item = await this.itemService.update(id, name);
      res.json({ data: item.toJSON() });
    } catch (error) { next(error); }
  };

  /** Remove um item existente e responde sem corpo com status 204. */
  delete = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = (res.locals as unknown as ValidatedLocals).validated.params!;
      await this.itemService.delete(id);
      res.status(204).end();
    } catch (error) { next(error); }
  };
}
