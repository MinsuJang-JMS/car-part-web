'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Order, ORDER_STATUS_LABEL, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

const ALL_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.userType !== 'admin') return;
    async function fetchOrder() {
      const snap = await getDoc(doc(db, 'orders', id));
      if (!snap.exists()) { setFetching(false); return; }
      const data = snap.data();
      const o: Order = {
        id: snap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Order;
      setOrder(o);
      setSelectedStatus(o.status);
      setFetching(false);
    }
    fetchOrder();
  }, [user, id]);

  async function handleStatusUpdate() {
    if (!order || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: selectedStatus,
        updatedAt: serverTimestamp(),
      });
      setOrder(prev => prev ? { ...prev, status: selectedStatus } : prev);
      alert('상태가 변경되었습니다.');
    } catch (err) {
      console.error(err);
      alert('변경 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">주문을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-black">← 주문 목록</Link>
        <span className="text-gray-300">|</span>
        <span className="text-xs text-gray-400 font-mono">{order.id}</span>
      </div>

      <div className="flex flex-col gap-5">
        {/* 상태 변경 카드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-semibold text-black mb-4">주문 상태 변경</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-all ${
                  selectedStatus === s
                    ? STATUS_COLOR[s] + ' border-current'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {ORDER_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <button
            onClick={handleStatusUpdate}
            disabled={saving || selectedStatus === order.status}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? '저장 중...' : selectedStatus === order.status ? '현재 상태입니다' : `"${ORDER_STATUS_LABEL[selectedStatus]}"로 변경`}
          </button>
        </div>

        {/* 주문자 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-semibold text-black mb-3">주문자 정보</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">이름</span><span className="text-black">{order.userName}</span>
            <span className="text-gray-500">연락처</span><span className="text-black">{order.userPhone}</span>
            <span className="text-gray-500">이메일</span><span className="text-black">{order.userEmail}</span>
            <span className="text-gray-500">회원유형</span>
            <span className="text-black">
              {order.userType === 'business'
                ? `사업자 ${order.businessGrade?.toUpperCase() ?? ''}${order.businessName ? ` (${order.businessName})` : ''}`
                : '개인'}
            </span>
          </div>
        </div>

        {/* 배송지 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-semibold text-black mb-3">배송 정보</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">받는 분</span><span className="text-black">{order.recipientName}</span>
            <span className="text-gray-500">연락처</span><span className="text-black">{order.recipientPhone}</span>
            <span className="text-gray-500">주소</span><span className="text-black">{order.shippingAddress}</span>
            {order.note && (
              <>
                <span className="text-gray-500">요청사항</span><span className="text-black">{order.note}</span>
              </>
            )}
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-semibold text-black mb-3">주문 상품</p>
          <div className="flex flex-col gap-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🔩</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.price)} × {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-black flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-black">합계</span>
              <span className="font-bold text-blue-700 text-lg">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400 flex flex-col gap-1">
          <span>주문일시: {order.createdAt.toLocaleString('ko-KR')}</span>
          <span>최종수정: {order.updatedAt.toLocaleString('ko-KR')}</span>
        </div>
      </div>
    </div>
  );
}
