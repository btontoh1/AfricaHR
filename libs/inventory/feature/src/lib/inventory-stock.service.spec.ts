import { InventoryStockTransactionType } from '@prisma/client';
import { InventoryStockRepository } from '@africahr/inventory-data-access';
import { InventoryStockService } from './inventory-stock.service';

describe('InventoryStockService', () => {
  let service: InventoryStockService;
  let stock: jest.Mocked<InventoryStockRepository>;

  beforeEach(() => {
    stock = {
      postEntry: jest.fn(),
      postEntries: jest.fn(),
      reverseEntry: jest.fn(),
      getBalance: jest.fn(),
      listBalances: jest.fn(),
      listLedgerEntries: jest.fn(),
    } as unknown as jest.Mocked<InventoryStockRepository>;
    service = new InventoryStockService(stock);
  });

  it('posts a GOODS_RECEIVED entry for receiveGoods', async () => {
    await service.receiveGoods(
      'tenant-1',
      { warehouseId: 'wh-1', productId: 'prod-1', quantity: 100, unitCost: 2.5, referenceId: 'GRN-001' },
      'user-1',
    );

    expect(stock.postEntry).toHaveBeenCalledWith('tenant-1', {
      warehouseId: 'wh-1',
      productId: 'prod-1',
      transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
      quantityIn: 100,
      unitCost: 2.5,
      referenceId: 'GRN-001',
      note: undefined,
      actorUserId: 'user-1',
    });
  });

  it('posts a GOODS_ISSUED entry for issueGoods, carrying the reason as the note', async () => {
    await service.issueGoods(
      'tenant-1',
      { warehouseId: 'wh-1', productId: 'prod-1', quantity: 30, reason: 'Departmental consumption - IT' },
      'user-1',
    );

    expect(stock.postEntry).toHaveBeenCalledWith('tenant-1', {
      warehouseId: 'wh-1',
      productId: 'prod-1',
      transactionType: InventoryStockTransactionType.GOODS_ISSUED,
      quantityOut: 30,
      note: 'Departmental consumption - IT',
      actorUserId: 'user-1',
    });
  });

  it('posts a transfer as a TRANSFER_OUT and TRANSFER_IN pair sharing one reference id', async () => {
    await service.transferStock(
      'tenant-1',
      { fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', productId: 'prod-1', quantity: 10 },
      'user-1',
    );

    expect(stock.postEntries).toHaveBeenCalledTimes(1);
    const [, entries] = stock.postEntries.mock.calls[0];
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      warehouseId: 'wh-1',
      transactionType: InventoryStockTransactionType.TRANSFER_OUT,
      quantityOut: 10,
      referenceType: 'StockTransfer',
    });
    expect(entries[1]).toMatchObject({
      warehouseId: 'wh-2',
      transactionType: InventoryStockTransactionType.TRANSFER_IN,
      quantityIn: 10,
      referenceType: 'StockTransfer',
    });
    expect(entries[0].referenceId).toBe(entries[1].referenceId);
  });

  it('delegates reverseEntry with the reason as the note', async () => {
    await service.reverseEntry('tenant-1', 'entry-1', 'Wrong quantity entered', 'user-1');

    expect(stock.reverseEntry).toHaveBeenCalledWith('tenant-1', 'entry-1', 'user-1', 'Wrong quantity entered');
  });
});
