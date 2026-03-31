'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Brand } from '@/types';
import Link from 'next/link';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const snap = await getDocs(query(collection(db, 'brands'), orderBy('name')));
      setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand));
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div className="flex flex-1 items-center justify-center"><p className="text-gray-500 text-sm">불러오는 중...</p></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">브랜드</h1>
      {brands.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🏷️</p>
          <p>등록된 브랜드가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {brands.map(brand => (
            <Link
              key={brand.id}
              href={`/brands/${encodeURIComponent(brand.name)}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all text-center group"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-600 mx-auto mb-3">
                {brand.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-black group-hover:text-blue-600 transition-colors">{brand.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
