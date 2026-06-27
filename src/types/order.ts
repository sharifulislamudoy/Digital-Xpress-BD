export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "returned"
  | "cancelled";

export type PaymentStatus = "unpaid" | "partial" | "paid";
export type DeliveryType = "home" | "point";

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  productName: string;
  productSlug?: string | null;
  productImage?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt?: string;
}

export interface Order {
  id: string;
  invoiceNo: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  alternativePhone?: string | null;
  recipientEmail?: string | null;
  customerAddress: string;
  district: string;
  thana?: string | null;
  deliveryType: DeliveryType;
  totalAmount: number;
  deliveryCharge: number;
  discountAmount: number;
  paidAmount: number;
  dueAmount: number;
  codAmount: number;
  note?: string | null;
  itemDescription?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  courierName?: string | null;
  courierTrackingNumber?: string | null;
  courierNote?: string | null;
  courierAssignedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export const bdDistrictOptions = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogra",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chittagong",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka City",
  "Dhaka Sub-Urban",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokati",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachori",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kustia",
  "Lalmonirhat",
  "Laxmipur",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narshindi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Shariatpur",
  "Shatkhira",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
] as const;

export const DHAKA_DELIVERY_CHARGE = 80;
export const OUTSIDE_DHAKA_DELIVERY_CHARGE = 130;

export function isDhakaDistrict(district?: string | null) {
  return (district || "").trim().toLowerCase().startsWith("dhaka");
}

export function getDeliveryChargeByDistrict(district?: string | null) {
  return isDhakaDistrict(district)
    ? DHAKA_DELIVERY_CHARGE
    : OUTSIDE_DHAKA_DELIVERY_CHARGE;
}

export const orderStatusOptions: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Return" },
  { value: "cancelled", label: "Cancelled" },
];

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  returned: "Return",
  cancelled: "Cancelled",
};

export function canCancelOrder(status: OrderStatus) {
  return status === "pending";
}

export interface OrderItemProfitFieldsPatch {
  unitCostPrice?: number;
  totalCost?: number;
  profit?: number;
  costBreakdown?:
    | Array<{
        batchId: string | null;
        batchNo: string | null;
        quantity: number;
        unitCostPrice: number;
        totalCost: number;
        source: "batch" | "legacy";
      }>
    | null;
}

export interface OrderProfitFieldsPatch {
  productCostTotal?: number;
  grossProfit?: number;
  actualCourierCost?: number;
  packagingCost?: number;
  paymentFee?: number;
  otherCost?: number;
  netProfit?: number;
  inventoryRestoredAt?: string | null;
}
