'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getPrice, formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

export default function BrandProductsPage() {
  const { name } = useParams<{ name: string }>();
  const brandName = decodeURIComponent(name);
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const snap = await getDocs(
        query(collection(db, 'products'), where('brand', '==', brandName))
      );
      setProducts(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }) as Product)
          .filter(p => p.isActive)
      );
      setLoading(false);
    }
    fetchProducts();
  }, [brandName]);

  if (loading) return <div className="flex flex-1 items-center justify-center"><p className="text-gray-500 text-sm">불러오는 중...</p></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/brands" className="text-sm text-gray-500 hover:text-black">브랜드</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-black">{brandName}</h1>
        <span className="text-sm text-gray-400">({products.length}개)</span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">📦</p>
          <p>등록된 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(product => {
            const price = user?.status === 'active'
              ? getPrice(product.prices, user.userType, user.businessGrade)
              : product.prices.individual;
            return (
              <Link key={product.id} href={`/products/${product.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-sm transition-all group">
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.imageUrls?.[0]
                    ? <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                    : <span className="text-4xl">🔩</span>}
                </div>
                <div className="p-3">
                  {product.brand && <p className="text-xs text-blue-500 mb-0.5">{product.brand}</p>}
                  <p className="text-sm font-medium text-black line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(price)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
