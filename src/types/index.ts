export type UserType = 'individual' | 'business' | 'admin';

export interface Brand {
  id: string;
  name: string;
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
