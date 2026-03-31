'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category } from '@/types';
import Link from 'next/link';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const q = query(collection(db, 'categories'), orderBy('order'));
      const snap = await getDocs(q);
      // parentId가 없거나 null인 최상위 카테고리만 표시
      setCategories(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }) as Category)
          .filter(c => !c.parentId)
      );
      setLoading(false);
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">카테고리</h1>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">📦</p>
          <p>등록된 카테고리가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all text-center group"
            >
              {cat.imageUrl && (
                <img src={cat.imageUrl} alt={cat.name} className="w-16 h-16 object-contain mx-auto mb-3" />
              )}
              {!cat.imageUrl && (
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center text-2xl">
                  🔧
                </div>
              )}
              <p className="text-sm font-medium text-black group-hover:text-blue-600 transition-colors">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
