'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Brand } from '@/types';
import Link from 'next/link';

export default function AdminBrandsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  async function fetchBrands() {
    const snap = await getDocs(query(collection(db, 'brands'), orderBy('name')));
    setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand));
  }

  useEffect(() => { fetchBrands(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError('');
    setSubmitting(true);
    const existing = await getDocs(query(collection(db, 'brands'), where('name', '==', trimmed), limit(1)));
    if (!existing.empty) {
      setError('이미 존재하는 브랜드입니다.');
      setSubmitting(false);
      return;
    }
    await addDoc(collection(db, 'brands'), { name: trimmed, createdAt: new Date() });
    setName('');
    await fetchBrands();
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('브랜드를 삭제하시겠습니까?')) return;
    await deleteDoc(doc(db, 'brands', id));
    await fetchBrands();
  }

  if (loading || user?.userType !== 'admin') return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-black">← 관리자</Link>
        <h1 className="text-xl font-bold text-black">브랜드 관리</h1>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex gap-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder="브랜드명 (예: NGK, 만필터, 부쉬)"
          className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          추가
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex flex-col gap-2">
        {brands.map(brand => (
          <div key={brand.id} className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                {brand.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-black">{brand.name}</span>
            </div>
            <button onClick={() => handleDelete(brand.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">
              삭제
            </button>
          </div>
        ))}
        {brands.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">등록된 브랜드가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
