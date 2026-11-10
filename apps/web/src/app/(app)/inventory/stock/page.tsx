'use client';

import { useState } from 'react';
import { useSession } from '../../session-provider';
import { ReceiveGoodsDialog } from '@/features/inventory/receive-goods-dialog';
import { IssueGoodsDialog } from '@/features/inventory/issue-goods-dialog';
import { TransferStockDialog } from '@/features/inventory/transfer-stock-dialog';
import { StockBalancesList } from '@/features/inventory/stock-balances-list';
import { StockLedgerList } from '@/features/inventory/stock-ledger-list';
import { StockBatchesList } from '@/features/inventory/stock-batches-list';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InventoryStockPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const [view, setView] = useState<'balances' | 'ledger' | 'batches'>('balances');

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Balances and movements across your warehouses"
        action={
          <div className="flex flex-wrap gap-2">
            <ReceiveGoodsDialog tenantId={tenantId} />
            <IssueGoodsDialog tenantId={tenantId} />
            <TransferStockDialog tenantId={tenantId} />
          </div>
        }
      />
      <Tabs value={view} onValueChange={(value) => setView(value as 'balances' | 'ledger' | 'batches')}>
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
        </TabsList>
        <TabsContent value="balances" className="mt-4">
          <StockBalancesList tenantId={tenantId} />
        </TabsContent>
        <TabsContent value="ledger" className="mt-4">
          <StockLedgerList tenantId={tenantId} />
        </TabsContent>
        <TabsContent value="batches" className="mt-4">
          <StockBatchesList tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
