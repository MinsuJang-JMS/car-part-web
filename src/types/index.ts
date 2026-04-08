export type UserType = 'individual' | 'business' | 'admin';

export type BrandCategory = 'import' | 'domestic' | 'oem';

export interface Brand {
  id: string;
  name: string;
  category: BrandCategory;
  imageUrl?: string;
  createdAt: Date;
}
export type UserStatus = 'active' | 'pending' | 'rejected';
export type BusinessGrade = 'a' | 'b' | 'c';

export interface User {
  uid: string;
  email: string;
  name: string;
  phone: string;
  userType: UserType;
  status: UserStatus;
  businessGrade?: BusinessGrade;
  businessName?: string;
  businessNumber?: string;
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  order: number;
  imageUrl?: string;
}

export interface ProductPrices {
  individual: number;
  business_a: number;
  business_b: number;
  business_c: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  brand?: string;
  imageUrls: string[];
  stock: number;
  compatibleVehicles: string[];
  prices: ProductPrices;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  isBest?: boolean;
  isNew?: boolean;
}

export interface PendingBusiness {
  id: string;
  userId: string;
  businessName: string;
  businessNumber: string;
  applicantName: string;
  phone: string;
  attachmentUrl?: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CartItem {
  productId: string;
  productName: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '주문접수',
  processing: '처리중',
  shipped: '배송중',
  completed: '완료',
  cancelled: '취소됨',
};

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  userType: UserType;
  businessGrade?: BusinessGrade;
  businessName?: string;
  items: CartItem[];
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note?: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
