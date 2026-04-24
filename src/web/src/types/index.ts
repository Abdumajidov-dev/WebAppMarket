export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors: string[];
}

export interface PagedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  isActive: boolean;
  primaryImageUrl?: string;
  categoryName?: string;
  categoryId?: string;
}

export interface ProductDetail extends Product {
  description?: string;
  images: ProductImage[];
  createdAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  sortOrder: number;
  children: Category[];
  imageUrl?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  imageUrl?: string;
  linkUrl?: string;
  bgGradient: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface OrderDetail extends Order {
  deliveryAddress: string;
  notes?: string;
  items: OrderItem[];
  latestProof?: PaymentProof;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentProof {
  id: string;
  fileUrl: string;
  fileType: string;
  status: string;
  adminNote?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "Cash" | "Payme" | "Click" | "CardTransfer";
export type PaymentStatus =
  | "Pending"
  | "AwaitingProof"
  | "ProofSubmitted"
  | "Paid"
  | "Failed";
