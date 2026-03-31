'use client';

import { useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getPrice, formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  bodyClass: string;
  engineSize: string;
  fuelType: string;
  driveType: string;
}

type Step = 'input' | 'loading' | 'result' | 'error';

export default function VinPage() {
  const { user } = useAuth();
  const [vin, setVin] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = vin.trim().toUpperCase();
    if (cleaned.length !== 17) {
      setErrorMsg('VIN은 정확히 17자리여야 합니다.');
      setStep('error');
      return;
    }

    setStep('loading');
    setErrorMsg('');

    try {
      // 1. NHTSA API 호출 (Route Handler 경유)
      const res = await fetch(`/api/vin?vin=${cleaned}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || '차량 정보 조회에 실패했습니다.');
        setStep('error');
        return;
      }

      setVehicle(data);

      // 2. Firestore에서 호환 차량 검색
      // compatibleVehicles 배열에 "make model" 또는 "make model year" 포함 여부로 필터
      const allSnap = await getDocs(query(collection(db, 'products')));
      const all = allSnap.docs
        .map(d => ({ id: d.id, ...d.data() }) as Product)
        .filter(p => p.isActive);

      const makeModel = `${data.make} ${data.model}`.toLowerCase();
      const year = data.year;

      const compatible = all.filter(p =>
        (p.compatibleVehicles ?? []).some(v => {
          const vl = v.toLowerCase();
          return vl.includes(makeModel) || (year && vl.includes(year) && vl.includes(data.make.toLowerCase()));
        })
      );

      setProducts(compatible);
      setStep('result');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      setStep('error');
    }
  }

  function reset() {
    setVin('');
    setStep('input');
    setVehicle(null);
    setProducts([]);
    setErrorMsg('');
  }

  const calcPrice = (p: Product) =>
    user?.status === 'active' ? getPrice(p.prices, user.userType, user.businessGrade) : p.prices.individual;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-1">VIN 차대번호 조회</h1>
      <p className="text-sm text-gray-600 mb-8">차대번호(17자리)로 내 차에 맞는 부품을 찾아보세요.</p>

      {/* 입력 폼 */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={vin}
          onChange={e => setVin(e.target.value.toUpperCase())}
          placeholder="17자리 차대번호 입력 (예: 1HGCM82633A004352)"
          maxLength={17}
          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder-gray-400 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={step === 'loading'}
          className="bg-blue-600 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {step === 'loading' ? '조회 중...' : '조회'}
        </button>
      </form>

      {/* 로딩 */}
      {step === 'loading' && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">차량 정보를 조회하고 있습니다...</p>
        </div>
      )}

      {/* 에러 */}
      {step === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <p className="text-red-600 font-medium mb-1">조회 실패</p>
          <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
          <button onClick={reset} className="text-sm text-blue-600 hover:underline">다시 시도</button>
        </div>
      )}

      {/* 결과 */}
      {step === 'result' && vehicle && (
        <div>
          {/* 차량 정보 카드 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-blue-500 font-medium mb-1">조회된 차량</p>
                <h2 className="text-2xl font-bold text-black">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h2>
              </div>
              <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                다시 조회
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: '차체 형태', value: vehicle.bodyClass },
                { label: '엔진', value: vehicle.engineSize },
                { label: '연료', value: vehicle.fuelType },
                { label: '구동 방식', value: vehicle.driveType },
                { label: 'VIN', value: vin.toUpperCase() },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-black">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 호환 부품 목록 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">
              호환 부품
              <span className="text-base font-normal text-gray-500 ml-2">
                {products.length > 0 ? `${products.length}개` : ''}
              </span>
            </h3>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-600 font-medium mb-1">호환 부품이 없습니다</p>
              <p className="text-sm text-gray-400 mb-4">
                {vehicle.make} {vehicle.model}에 맞는 부품이 아직 등록되지 않았습니다.
              </p>
              <Link href="/products" className="text-sm text-blue-600 hover:underline">
                전체 상품 보기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map(product => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-sm transition-all group"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.imageUrls?.[0]
                      ? <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                      : <span className="text-4xl">🔩</span>}
                  </div>
                  <div className="p-3">
                    {product.brand && <p className="text-xs text-blue-500 mb-0.5">{product.brand}</p>}
                    <p className="text-sm font-medium text-black line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(calcPrice(product))}</p>
                    {product.stock === 0 && <p className="text-xs text-red-500 mt-1">품절</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 안내 (입력 전) */}
      {step === 'input' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-black mb-3">VIN 번호란?</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            차대번호(VIN, Vehicle Identification Number)는 차량을 식별하는 17자리 고유 번호입니다.<br />
            자동차 등록증, 차량 앞유리 하단(대시보드), 또는 운전석 문틀에서 확인할 수 있습니다.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">📌 확인 위치</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>자동차 등록증 (차대번호 항목)</li>
              <li>앞 유리창 하단 대시보드 위</li>
              <li>운전석 도어 프레임 스티커</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
