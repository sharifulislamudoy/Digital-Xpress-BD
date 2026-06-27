import type { Product, StockStatus } from "@/types/product";

export type InventoryMovementType =
  | "PURCHASE"
  | "SALE"
  | "CANCEL_RESTORE"
  | "RETURN_RESTORE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "DAMAGE"
  | "LOSS";

export interface InventoryBatch {
  id: string;
  productId: string;
  batchNo: string;
  purchaseQuantity: number;
  remainingQuantity: number;
  unitCostPrice: number;
  mrp?: number | null;
  sellingPrice?: number | null;
  totalCost: number;
  supplierName?: string | null;
  supplierPhone?: string | null;
  supplierInvoiceNumber?: string | null;
  purchaseDate: string;
  note?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  batchId?: string | null;
  type: InventoryMovementType;
  quantity: number;
  unitCostPrice?: number | null;
  totalCost?: number | null;
  reason?: string | null;
  referenceType?: string | null;
  referenceNo?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
    mainImageUrl?: string | null;
  } | null;
  batch?: InventoryBatch | null;
}

export interface InventoryProduct extends Product {
  stock: number;
  stockStatus: StockStatus;
  costPrice?: number | null;
  averageCost?: number | null;
  lastPurchaseCost?: number | null;
  stockValue?: number | null;
  estimatedProfitPerUnit?: number | null;
  inventoryBatches?: InventoryBatch[];
}

export interface InventoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InventoryProductsResponse {
  success: boolean;
  products: InventoryProduct[];
  pagination: InventoryPagination;
  message?: string;
}

export interface InventoryProductDetailsResponse {
  success: boolean;
  product: InventoryProduct;
  batches: InventoryBatch[];
  movements: InventoryMovement[];
  message?: string;
}
