'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Order, ORDER_STATUS_LABEL, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.userType !== 'admin') return;
    async function fetchOrders() {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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

  if (user?.userType !== 'admin') return null;

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">주문 관리</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-0.5">미처리 주문 {pendingCount}건</p>
          )}
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-black">← 대시보드</Link>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            filterStatus === 'all' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          전체 ({orders.length})
        </button>
        {ALL_STATUSES.map(s => {
          const count = orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filterStatus === s ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {ORDER_STATUS_LABEL[s]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">해당 상태의 주문이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">주문일시</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">주문자</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium hidden sm:table-cell">상품</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">금액</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">상태</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {order.createdAt.toLocaleDateString('ko-KR')}<br />
                    <span className="text-gray-400">{order.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-black">{order.userName}</p>
                    <p className="text-xs text-gray-500">{order.userPhone}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-700">
                    {order.items[0]?.productName}
                    {order.items.length > 1 && <span className="text-gray-400"> 외 {order.items.length - 1}건</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-black whitespace-nowrap">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                    >
                      상세 보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
