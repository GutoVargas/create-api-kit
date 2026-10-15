import { Router } from 'express';
import { ItemController } from '../controllers/item-controller.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { ItemService } from '../services/item-service.js';
import { createItemSchema, itemIdSchema } from '../schemas/item-schemas.js';
import { validateRequest } from '../middlewares/validate.js';

const router = Router();
const controller = new ItemController(new ItemService(new ItemRepository()));

router.get('/', controller.list);
router.post('/', validateRequest({ body: createItemSchema }), controller.create);
router.get('/:id', validateRequest({ params: itemIdSchema }), controller.get);
router.put('/:id', validateRequest({ params: itemIdSchema, body: createItemSchema }), controller.update);
router.delete('/:id', validateRequest({ params: itemIdSchema }), controller.delete);

export { router as itemsRouter };
