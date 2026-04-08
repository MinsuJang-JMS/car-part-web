'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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

export default function MyOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);

  // 수정 모드
  const [editing, setEditing] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // 취소 확인
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchOrder() {
      const snap = await getDoc(doc(db, 'orders', id));
      if (!snap.exists()) { setFetching(false); return; }
      const data = snap.data();
      // 본인 주문인지 확인
      if (data.userId !== user!.uid) { router.replace('/my-orders'); return; }
      const o: Order = {
        id: snap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Order;
      setOrder(o);
      setRecipientName(o.recipientName);
      setRecipientPhone(o.recipientPhone);
      setShippingAddress(o.shippingAddress);
      setNote(o.note ?? '');
      setFetching(false);
    }
    fetchOrder();
  }, [user, id, router]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!order || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        recipientName,
        recipientPhone,
        shippingAddress,
        note: note || null,
        updatedAt: serverTimestamp(),
      });
      setOrder(prev => prev ? { ...prev, recipientName, recipientPhone, shippingAddress, note } : prev);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!order || cancelling) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      setConfirmCancel(false);
    } catch (err) {
      console.error(err);
      alert('취소 중 오류가 발생했습니다.');
    } finally {
      setCancelling(false);
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
      <div className="flex flex-1 items-center justify-center flex-col gap-3">
        <p className="text-gray-500">주문을 찾을 수 없습니다.</p>
        <Link href="/my-orders" className="text-sm text-blue-600 hover:underline">주문 목록으로</Link>
      </div>
    );
  }

  const canModify = order.status === 'pending';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/my-orders" className="text-sm text-gray-500 hover:text-black">← 주문 목록</Link>
      </div>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-black">주문 상세</h1>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* 주문 상품 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="font-semibold text-black mb-3">주문 상품</p>
        <div className="flex flex-col gap-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  : <span className="text-xl">🔩</span>
                }
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

      {/* 배송 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-black">배송 정보</p>
          {canModify && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-50 transition-colors"
            >
              수정
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">받는 분</label>
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">연락처</label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">배송지 주소</label>
              <input
                type="text"
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">요청사항</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setRecipientName(order.recipientName);
                  setRecipientPhone(order.recipientPhone);
                  setShippingAddress(order.shippingAddress);
                  setNote(order.note ?? '');
                }}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
            <span className="text-gray-500">받는 분</span><span className="text-black">{order.recipientName}</span>
            <span className="text-gray-500">연락처</span><span className="text-black">{order.recipientPhone}</span>
            <span className="text-gray-500">배송지</span><span className="text-black">{order.shippingAddress}</span>
            {order.note && (
              <><span className="text-gray-500">요청사항</span><span className="text-black">{order.note}</span></>
            )}
          </div>
        )}
      </div>

      {/* 주문 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="font-semibold text-black mb-3">주문 정보</p>
        <div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
          <span className="text-gray-500">주문번호</span>
          <span className="text-black font-mono text-xs break-all">{order.id}</span>
          <span className="text-gray-500">주문일시</span>
          <span className="text-black">{order.createdAt.toLocaleString('ko-KR')}</span>
          <span className="text-gray-500">최종수정</span>
          <span className="text-black">{order.updatedAt.toLocaleString('ko-KR')}</span>
        </div>
      </div>

      {/* 취소 버튼 — 주문접수 상태일 때만 */}
      {canModify && (
        <div className="mt-2">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              주문 취소
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm font-medium text-red-700">정말 주문을 취소하시겠습니까?</p>
              <p className="text-xs text-red-500">취소 후에는 되돌릴 수 없습니다.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {cancelling ? '취소 중...' : '확인, 취소합니다'}
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!canModify && order.status !== 'cancelled' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">처리가 시작된 주문은 수정/취소가 불가합니다. 담당자에게 문의해주세요.</p>
        </div>
      )}
    </div>
  );
}
