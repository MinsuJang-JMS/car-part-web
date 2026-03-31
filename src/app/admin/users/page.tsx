'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { PendingBusiness, BusinessGrade } from '@/types';
import Link from 'next/link';

interface PendingItem extends PendingBusiness {
  selectedGrade: BusinessGrade;
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchPending() {
      const snap = await getDocs(
        query(collection(db, 'pendingBusinesses'), where('status', '==', 'pending'))
      );
      setItems(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          selectedGrade: 'c',
        }) as PendingItem)
      );
      setFetching(false);
    }
    fetchPending();
  }, []);

  function setGrade(id: string, grade: BusinessGrade) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selectedGrade: grade } : item));
  }

  async function handleApprove(item: PendingItem) {
    setProcessing(item.id);
    await Promise.all([
      updateDoc(doc(db, 'users', item.userId), {
        status: 'active',
        businessGrade: item.selectedGrade,
        approvedAt: serverTimestamp(),
        approvedBy: user!.uid,
      }),
      updateDoc(doc(db, 'pendingBusinesses', item.id), { status: 'approved' }),
    ]);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setProcessing(null);
  }

  async function handleReject(item: PendingItem) {
    setProcessing(item.id);
    await Promise.all([
      updateDoc(doc(db, 'users', item.userId), { status: 'rejected' }),
      updateDoc(doc(db, 'pendingBusinesses', item.id), { status: 'rejected' }),
    ]);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setProcessing(null);
  }

  if (loading || user?.userType !== 'admin') return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-black">← 관리자</Link>
        <h1 className="text-xl font-bold text-black">사업자 승인 대기</h1>
        {!fetching && <span className="text-sm text-gray-500">({items.length}건)</span>}
      </div>

      {fetching ? (
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">✅</p>
          <p>승인 대기 중인 사업자가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex flex-col gap-1 text-sm">
                  <p className="font-semibold text-black text-base">{item.businessName}</p>
                  <p className="text-gray-700">사업자번호: {item.businessNumber}</p>
                  <p className="text-gray-700">담당자: {item.applicantName}</p>
                  <p className="text-gray-700">연락처: {item.phone}</p>
                </div>

                <div className="flex flex-col gap-2 min-w-[160px]">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-black">승인 등급</label>
                    <select
                      value={item.selectedGrade}
                      onChange={e => setGrade(item.id, e.target.value as BusinessGrade)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="a">A등급 (최대 할인)</option>
                      <option value="b">B등급 (중간 할인)</option>
                      <option value="c">C등급 (소폭 할인)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={processing === item.id}
                    className="bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(item)}
                    disabled={processing === item.id}
                    className="border border-red-300 text-red-600 rounded-lg py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    거절
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
