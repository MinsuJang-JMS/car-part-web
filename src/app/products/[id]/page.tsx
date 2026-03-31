'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getPrice, formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() } as Product);
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">상품을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const price = user?.status === 'active'
    ? getPrice(product.prices, user.userType, user.businessGrade)
    : product.prices.individual;

  const priceLabel = user?.status === 'active' && user.userType === 'business'
    ? `사업자 ${user.businessGrade?.toUpperCase() ?? ''} 가격`
    : '개인 가격';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/categories" className="text-sm text-gray-500 hover:text-black mb-6 inline-block">
        ← 카테고리로 돌아가기
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* 이미지 */}
        <div className="flex flex-col gap-2 md:w-96">
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            {product.imageUrls?.[selectedImg] ? (
              <img
                src={product.imageUrls[selectedImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl">🔩</span>
            )}
          </div>
          {product.imageUrls?.length > 1 && (
            <div className="flex gap-2">
              {product.imageUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImg === i ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="flex flex-col flex-1 gap-4">
          <h1 className="text-2xl font-bold text-black">{product.name}</h1>

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-600 mb-1">{priceLabel}</p>
            <p className="text-3xl font-bold text-blue-700">{formatPrice(price)}</p>
            {!user && (
              <p className="text-xs text-gray-500 mt-1">
                <Link href="/login" className="text-blue-600 underline">로그인</Link> 하면 사업자 할인가를 확인할 수 있습니다.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {product.stock > 0 ? `재고 ${product.stock}개` : '품절'}
            </span>
          </div>

          {product.description && (
            <div>
              <p className="text-sm font-medium text-black mb-1">상품 설명</p>
              <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.compatibleVehicles?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-black mb-2">호환 차량</p>
              <div className="flex flex-wrap gap-2">
                {product.compatibleVehicles.map((v, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 rounded-md px-2 py-1">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 사업자 등급별 가격표 (어드민/사업자에게만 표시) */}
          {user?.userType === 'admin' && (
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-black mb-3">등급별 가격</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">개인가</span><span className="font-medium text-black">{formatPrice(product.prices.individual)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">사업자 A</span><span className="font-medium text-black">{formatPrice(product.prices.business_a)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">사업자 B</span><span className="font-medium text-black">{formatPrice(product.prices.business_b)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">사업자 C</span><span className="font-medium text-black">{formatPrice(product.prices.business_c)}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
