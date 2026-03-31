'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { getPrice, formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

interface SiteConfig {
  companyName?: string;
  companyIntro?: string;
  companyAddress?: string;
  companyPhone?: string;
  businessHours?: string;
  businessNumber?: string;
}

function ProductCard({ product, price }: { product: Product; price: number }) {
  return (
    <Link href={`/products/${product.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all group flex-shrink-0 w-44 sm:w-52">
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.imageUrls?.[0]
          ? <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
          : <span className="text-4xl">🔩</span>}
      </div>
      <div className="p-3">
        {product.brand && <p className="text-xs text-blue-500 mb-0.5">{product.brand}</p>}
        <p className="text-sm font-medium text-black line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</p>
        <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [bestProducts, setBestProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});

  useEffect(() => {
    async function fetchData() {
      const [bestSnap, newSnap, configSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), where('isBest', '==', true))),
        getDocs(query(collection(db, 'products'), where('isNew', '==', true))),
        getDoc(doc(db, 'siteConfig', 'main')),
      ]);
      setBestProducts(bestSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product).filter(p => p.isActive));
      setNewProducts(newSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product).filter(p => p.isActive));
      if (configSnap.exists()) setSiteConfig(configSnap.data() as SiteConfig);
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><p className="text-slate-400 text-sm">로딩 중...</p></div>;
  }

  const calcPrice = (p: Product) =>
    user?.status === 'active' ? getPrice(p.prices, user.userType, user.businessGrade) : p.prices.individual;

  return (
    <div className="flex flex-col flex-1">

      {/* ── 히어로 ── */}
      <section
        className="py-20 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 60%, #0f172a 100%)' }}
      >
        <p className="text-blue-300 text-sm font-medium tracking-widest uppercase mb-3">B2B / B2C 차량 부품 전문</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
          필요한 부품을<br />
          <span className="text-blue-400">빠르고 정확하게</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg mb-10 max-w-md mx-auto">
          VIN 차대번호로 내 차에 맞는 부품을 바로 찾고,<br />사업자 등급별 특가로 구매하세요.
        </p>
        {user?.status === 'pending' ? (
          <Link href="/pending" className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 font-semibold rounded-xl px-6 py-3 hover:bg-amber-300 transition-colors">
            ⏳ 사업자 승인 대기 중 — 상세 보기
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/products" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl px-8 py-3 transition-colors shadow-lg">
              🔧 전체상품 보기
            </Link>
            <Link href="/vin" className="border border-slate-500 text-slate-300 hover:border-slate-300 hover:text-white font-medium rounded-xl px-8 py-3 transition-all">
              🔍 VIN 조회
            </Link>
          </div>
        )}
      </section>

      {/* ── 특징 3개 ── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { icon: '🔍', color: 'bg-blue-50', title: 'VIN 차대번호 조회', desc: '17자리 입력으로 내 차 맞는 부품 자동 필터링' },
          { icon: '💰', color: 'bg-green-50', title: '사업자 등급 할인', desc: 'A/B/C 등급별 최대 할인가. 승인 후 즉시 적용' },
          { icon: '📦', color: 'bg-purple-50', title: '다양한 부품 카탈로그', desc: '엔진·브레이크·서스펜션 등 전 차종 부품 보유' },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>{f.icon}</div>
            <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── 베스트 상품 ── */}
      {bestProducts.length > 0 && (
        <section className="max-w-6xl mx-auto w-full px-4 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">🏆 베스트 상품</h2>
            <Link href="/products?filter=best" className="text-sm text-blue-600 hover:underline">전체 보기</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {bestProducts.map(p => <ProductCard key={p.id} product={p} price={calcPrice(p)} />)}
          </div>
        </section>
      )}

      {/* ── 신상품 ── */}
      {newProducts.length > 0 && (
        <section className="max-w-6xl mx-auto w-full px-4 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">✨ 신상품</h2>
            <Link href="/products?filter=new" className="text-sm text-blue-600 hover:underline">전체 보기</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {newProducts.map(p => <ProductCard key={p.id} product={p} price={calcPrice(p)} />)}
          </div>
        </section>
      )}

      {/* ── 회사 소개 ── */}
      {siteConfig.companyIntro && (
        <section className="max-w-5xl mx-auto w-full px-4 pb-12">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              광
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-2">{siteConfig.companyName || '광일통상'}</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{siteConfig.companyIntro}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                {siteConfig.companyPhone && <span>📞 {siteConfig.companyPhone}</span>}
                {siteConfig.businessHours && <span>🕐 {siteConfig.businessHours}</span>}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
