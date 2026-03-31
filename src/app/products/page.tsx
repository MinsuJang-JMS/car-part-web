'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getPrice, formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

export default function AllProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const snap = await getDocs(query(collection(db, 'products'), where('isActive', '==', true)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);
      setProducts(list);
      setFiltered(list);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) { setFiltered(products); return; }
    setFiltered(products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand ?? '').toLowerCase().includes(q)
    ));
  }, [search, products]);

  if (loading) return <div className="flex flex-1 items-center justify-center"><p className="text-gray-500 text-sm">불러오는 중...</p></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-black">전체상품 <span className="text-base font-normal text-gray-500">({filtered.length}개)</span></h1>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="상품명 또는 브랜드 검색..."
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map(product => {
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
                  {product.stock === 0 && <p className="text-xs text-red-500 mt-1">품절</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
