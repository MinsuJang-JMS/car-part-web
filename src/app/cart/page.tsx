'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItem, updateQty, totalAmount } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
        <p className="text-5xl">🛒</p>
        <p className="text-xl font-semibold text-gray-700">장바구니가 비어 있습니다</p>
        <Link href="/products" className="mt-2 text-sm text-blue-600 hover:underline">
          상품 보러 가기
        </Link>
      </div>
    );
  }

  function handleCheckout() {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/checkout');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">장바구니</h1>

      <div className="flex flex-col gap-3 mb-6">
        {items.map(item => (
          <div key={item.productId} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🔩</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/products/${item.productId}`} className="font-medium text-black hover:text-blue-600 text-sm line-clamp-2">
                {item.productName}
              </Link>
              <p className="text-sm text-blue-700 font-semibold mt-0.5">{formatPrice(item.price)}</p>
            </div>

            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <button
                onClick={() => updateQty(item.productId, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              >−</button>
              <span className="w-8 text-center text-sm font-medium text-black">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.productId, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              >+</button>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-black">{formatPrice(item.price * item.quantity)}</p>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-xs text-red-400 hover:text-red-600 mt-1"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">총 금액</span>
          <span className="text-xl font-bold text-blue-700">{formatPrice(totalAmount)}</span>
        </div>
        {!user && (
          <p className="text-xs text-gray-500 mb-3">주문하려면 로그인이 필요합니다.</p>
        )}
        <button
          onClick={handleCheckout}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {user ? '주문하기' : '로그인 후 주문하기'}
        </button>
      </div>
    </div>
  );
}
