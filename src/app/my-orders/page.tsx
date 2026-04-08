'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Order, ORDER_STATUS_LABEL, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';
import { Suspense } from 'react';

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function MyOrdersContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const newOrderId = searchParams.get('new');

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchOrders() {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user!.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Order;
      });
      setOrders(list);
      setFetching(false);
    }
    fetchOrders();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-2">내 주문 현황</h1>
      <p className="text-sm text-gray-500 mb-6">총 {orders.length}건</p>

      {newOrderId && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800 font-medium">주문이 접수되었습니다!</p>
          <p className="text-xs text-green-700 mt-0.5">담당자가 확인 후 연락드리겠습니다.</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-3">아직 주문 내역이 없습니다.</p>
          <Link href="/products" className="text-sm text-blue-600 hover:underline">상품 보러 가기</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => (
            <Link
              key={order.id}
              href={`/my-orders/${order.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status]}`}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {order.createdAt.toLocaleDateString('ko-KR')}
                  </span>
                  {order.status === 'pending' && (
                    <span className="text-xs text-blue-500 font-medium">수정·취소 가능</span>
                  )}
                </div>
                <p className="text-sm font-medium text-black truncate">
                  {order.items[0]?.productName}
                  {order.items.length > 1 && ` 외 ${order.items.length - 1}건`}
                </p>
                <p className="text-sm font-bold text-blue-700">{formatPrice(order.totalAmount)}</p>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 ml-3 transition-colors"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense>
      <MyOrdersContent />
    </Suspense>
  );
}
