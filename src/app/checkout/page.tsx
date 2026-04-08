'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/priceUtils';

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const router = useRouter();

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && items.length === 0) router.replace('/cart');
  }, [items, loading, router]);

  useEffect(() => {
    if (user) {
      setRecipientName(user.name);
      setRecipientPhone(user.phone ?? '');
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userName: user.name,
        userPhone: user.phone,
        userEmail: user.email,
        userType: user.userType,
        businessGrade: user.businessGrade ?? null,
        businessName: user.businessName ?? null,
        items,
        recipientName,
        recipientPhone,
        shippingAddress,
        note: note || null,
        totalAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clearCart();
      router.push(`/my-orders?new=${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert('주문 중 오류가 발생했습니다. 다시 시도해주세요.');
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">주문 정보 입력</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 주문 상품 요약 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-semibold text-black mb-3">주문 상품</p>
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-700 flex-1 truncate pr-4">{item.productName} × {item.quantity}</span>
                <span className="font-medium text-black flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between">
              <span className="font-semibold text-black">합계</span>
              <span className="font-bold text-blue-700 text-lg">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* 받는 분 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
          <p className="font-semibold text-black">받는 분 정보</p>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">이름 *</label>
            <input
              type="text"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400"
              placeholder="받는 분 이름"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">연락처 *</label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={e => setRecipientPhone(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400"
              placeholder="010-0000-0000"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">배송지 주소 *</label>
            <input
              type="text"
              value={shippingAddress}
              onChange={e => setShippingAddress(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400"
              placeholder="배송 받을 주소를 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">요청사항</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400 resize-none"
              placeholder="배송 관련 요청사항이 있으면 입력하세요"
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium">안내</p>
          <p className="text-xs text-amber-700 mt-1">주문 접수 후 담당자가 연락드려 최종 확인 및 결제 안내를 도와드립니다.</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold py-4 rounded-xl transition-colors text-base"
        >
          {submitting ? '주문 접수 중...' : '주문 접수하기'}
        </button>
      </form>
    </div>
  );
}
