'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Category } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getPrice, formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

export default function CategoryProductsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [catSnap, prodSnap] = await Promise.all([
        getDoc(doc(db, 'categories', id)),
        getDocs(query(
          collection(db, 'products'),
          where('categoryId', '==', id)
        )),
      ]);
      if (catSnap.exists()) setCategory({ id: catSnap.id, ...catSnap.data() } as Category);
      setProducts(
        prodSnap.docs
          .map(d => ({ id: d.id, ...d.data() }) as Product)
          .filter(p => p.isActive)
      );
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/categories" className="text-sm text-gray-500 hover:text-black">카테고리</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-black">{category?.name ?? '카테고리'}</h1>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">📦</p>
          <p>등록된 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => {
            const price = user?.status === 'active'
              ? getPrice(product.prices, user.userType, user.businessGrade)
              : product.prices.individual;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.imageUrls?.[0] ? (
                    <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🔩</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-black line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(price)}</p>
                  {product.stock === 0 && (
                    <p className="text-xs text-red-500 mt-1">품절</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
