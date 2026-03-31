'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs, deleteDoc, doc, orderBy, query, updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types';
import { formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

export default function AdminProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  async function fetchProducts() {
    const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
    setFetching(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 상품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    await deleteDoc(doc(db, 'products', id));
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function handleToggleActive(product: Product) {
    await updateDoc(doc(db, 'products', product.id), { isActive: !product.isActive });
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
  }

  if (loading || user?.userType !== 'admin') return null;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-black">← 관리자</Link>
          <h1 className="text-xl font-bold text-black">상품 목록</h1>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{products.length}개</span>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          + 상품 등록
        </Link>
      </div>

      {/* 검색 */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="상품명 또는 브랜드 검색..."
        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
      />

      {fetching ? (
        <p className="text-center text-gray-500 text-sm py-12">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-12">
          {search ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(product => (
            <div
              key={product.id}
              className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-4 transition-opacity ${!product.isActive ? 'opacity-50' : ''}`}
              style={{ borderColor: product.isActive ? '#e5e7eb' : '#fca5a5' }}
            >
              {/* 이미지 */}
              <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {product.imageUrls?.[0]
                  ? <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl">🔩</span>}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.brand && (
                    <span className="text-xs text-blue-500 font-medium">{product.brand}</span>
                  )}
                  {product.isBest && <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-1.5">🏆 베스트</span>}
                  {product.isNew && <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5">✨ 신상품</span>}
                  {!product.isActive && <span className="text-xs bg-red-100 text-red-600 rounded px-1.5">비활성</span>}
                </div>
                <p className="text-sm font-medium text-black truncate mt-0.5">{product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  개인가: {formatPrice(product.prices.individual)} · 재고: {product.stock}개
                </p>
              </div>

              {/* 액션 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`text-xs rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    product.isActive
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {product.isActive ? '숨기기' : '활성화'}
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
