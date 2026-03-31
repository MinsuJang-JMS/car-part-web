'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types';
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  async function fetchCategories() {
    const snap = await getDocs(query(collection(db, 'categories'), orderBy('order')));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Category));
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await addDoc(collection(db, 'categories'), {
      name,
      parentId: null,
      order: Number(order),
      createdAt: serverTimestamp(),
    });
    setName('');
    setOrder('');
    await fetchCategories();
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('카테고리를 삭제하시겠습니까?')) return;
    await deleteDoc(doc(db, 'categories', id));
    await fetchCategories();
  }

  if (loading || user?.userType !== 'admin') return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-black">← 관리자</Link>
        <h1 className="text-xl font-bold text-black">카테고리 관리</h1>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex gap-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder="카테고리명 (예: 엔진)"
          className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          value={order}
          onChange={e => setOrder(e.target.value)}
          required
          placeholder="순서"
          className="w-20 bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          추가
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-6 text-right">{cat.order}</span>
              <span className="text-sm font-medium text-black">{cat.name}</span>
            </div>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              삭제
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">등록된 카테고리가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
