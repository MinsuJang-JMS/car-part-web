import { UserType, BusinessGrade, ProductPrices } from '@/types';

export function getPriceKey(
  userType: UserType,
  businessGrade?: BusinessGrade
): keyof ProductPrices {
  if (userType === 'individual' || userType === 'admin') return 'individual';
  if (userType === 'business') {
    switch (businessGrade) {
      case 'a': return 'business_a';
      case 'b': return 'business_b';
      case 'c': return 'business_c';
      default:  return 'individual';
    }
  }
  return 'individual';
}

export function getPrice(prices: ProductPrices, userType: UserType, businessGrade?: BusinessGrade): number {
  const key = getPriceKey(userType, businessGrade);
  return prices[key];
}

export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}
