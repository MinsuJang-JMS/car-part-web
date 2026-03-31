'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Brand, BrandCategory } from '@/types';
import { getPrice, formatPrice } from '@/lib/priceUtils';
import Link from 'next/link';

interface SiteConfig {
  companyName?: string;
  companyIntro?: string;
  companyAddress?: string;
  companyPhone?: string;
  businessHours?: string;
}

const CATEGORY_META: Record<BrandCategory, { badge: string; title: string; sub: string }> = {
  import: {
    badge: '수입차',
    title: '외제차 정품 부품',
    sub: 'Mercedes-Benz · BMW · Audi · Porsche · Lexus 등 유럽·일본 브랜드 정품',
  },
  domestic: {
    badge: '국산차',
    title: '국산차 정품 부품',
    sub: '현대 · 기아 · 제네시스 · KGM · 르노코리아 등 순정 부품',
  },
  oem: {
    badge: 'OEM',
    title: 'OEM 부품',
    sub: '공인 OEM 제조사의 고품질 부품',
  },
};

// 카테고리별 기본 배경 색상 (이미지 없을 때)
const FALLBACK_BG: Record<BrandCategory, string> = {
  import: 'linear-gradient(135deg,#0c1a2e,#1e3a5f)',
  domestic: 'linear-gradient(135deg,#002c5f,#005baa)',
  oem:      'linear-gradient(135deg,#1a1a1a,#333)',
};

function BrandCard({ brand }: { brand: Brand }) {
  const cat: BrandCategory = (['import', 'domestic', 'oem'] as BrandCategory[]).includes(brand.category)
    ? brand.category : 'import';

  return (
    <Link
      href={`/brands/${encodeURIComponent(brand.name)}`}
      className="relative block overflow-hidden rounded-2xl group flex-shrink-0 w-44 sm:w-52 aspect-[3/2]"
    >
      {brand.imageUrl ? (
        <img
          src={brand.imageUrl}
          alt={brand.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: FALLBACK_BG[cat] }} />
      )}
      {/* 오버레이 */}
      <div
        className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-80"
        style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        <p className="text-white font-bold text-sm leading-tight drop-shadow">{brand.name}</p>
      </div>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-sm bg-white/20 rounded-full w-7 h-7 flex items-center justify-center backdrop-blur-sm">→</span>
      </div>
    </Link>
  );
}

function BrandSection({ cat, brands }: { cat: BrandCategory; brands: Brand[] }) {
  if (brands.length === 0) return null;
  const meta = CATEGORY_META[cat];
  return (
    <section className="max-w-6xl mx-auto w-full px-4 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {meta.badge}
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-black leading-tight">{meta.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{meta.sub}</p>
          </div>
        </div>
        <Link href="/brands" className="text-sm text-blue-600 hover:underline font-medium whitespace-nowrap">전체 →</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {brands.map(b => <BrandCard key={b.id} brand={b} />)}
      </div>
    </section>
  );
}

function ProductCard({ product, price }: { product: Product; price: number }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all group flex-shrink-0 w-44 sm:w-52"
    >
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
  const [importBrands, setImportBrands] = useState<Brand[]>([]);
  const [domesticBrands, setDomesticBrands] = useState<Brand[]>([]);
  const [oemBrands, setOemBrands] = useState<Brand[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [bestSnap, newSnap, configSnap, brandSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), where('isBest', '==', true))),
        getDocs(query(collection(db, 'products'), where('isNew', '==', true))),
        getDoc(doc(db, 'siteConfig', 'main')),
        getDocs(query(collection(db, 'brands'), orderBy('name'))),
      ]);

      setBestProducts(bestSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product).filter(p => p.isActive));
      setNewProducts(newSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product).filter(p => p.isActive));
      if (configSnap.exists()) setSiteConfig(configSnap.data() as SiteConfig);

      const allBrands = brandSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand);
      setImportBrands(allBrands.filter(b => b.category === 'import'));
      setDomesticBrands(allBrands.filter(b => b.category === 'domestic'));
      setOemBrands(allBrands.filter(b => b.category === 'oem'));
    }
    fetchData();
  }, []);

  const calcPrice = (p: Product) =>
    !loading && user?.status === 'active' ? getPrice(p.prices, user.userType, user.businessGrade) : p.prices.individual;

  return (
    <div className="flex flex-col flex-1">

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden" style={{ minHeight: 560 }}>
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80"
          alt="luxury car"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(120deg,rgba(10,20,40,0.92) 0%,rgba(15,30,60,0.82) 50%,rgba(0,0,0,0.65) 100%)' }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32">
          <span className="inline-block bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-semibold tracking-widest uppercase rounded-full px-4 py-1.5 mb-5">
            B2B / B2C 차량 부품 전문
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 leading-tight">
            국산 · 수입차<br />
            <span className="text-blue-400">부품 전문</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-xl mb-3 max-w-xl mx-auto leading-relaxed">
            정품 · OEM · 애프터마켓 부품을 한 곳에서
          </p>
          <p className="text-slate-400 text-sm sm:text-base mb-10 max-w-md mx-auto">
            Mercedes-Benz · BMW · Audi · 현대 · 기아 · 제네시스<br />
            VIN 차대번호 조회로 내 차에 맞는 부품을 정확하게
          </p>
          {user?.status === 'pending' ? (
            <Link href="/pending" className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 font-semibold rounded-2xl px-7 py-3.5 hover:bg-amber-300 transition-colors shadow-lg">
              ⏳ 사업자 승인 대기 중 — 상세 보기
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/products" className="bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl px-8 py-3.5 transition-colors shadow-xl text-base">
                🔧 전체상품 보기
              </Link>
              <Link href="/vin" className="bg-white/10 backdrop-blur border border-white/30 text-white hover:bg-white/20 font-semibold rounded-2xl px-8 py-3.5 transition-all text-base">
                🔍 VIN 조회
              </Link>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom,transparent,#f8fafc)' }} />
      </section>

      {/* ── 브랜드 섹션 (Firebase 동적) ── */}
      <div className="pt-10">
        <BrandSection cat="import" brands={importBrands} />
        <BrandSection cat="domestic" brands={domesticBrands} />
        <BrandSection cat="oem" brands={oemBrands} />
      </div>

      {/* 브랜드 미등록 안내 */}
      {importBrands.length === 0 && domesticBrands.length === 0 && oemBrands.length === 0 && (
        <div className="max-w-6xl mx-auto w-full px-4 pb-10 text-center text-slate-400 text-sm">
          <p className="mb-2">아직 등록된 브랜드가 없습니다.</p>
          <Link href="/admin/brands" className="text-blue-500 hover:underline">관리자 &gt; 브랜드 관리에서 추가하세요</Link>
        </div>
      )}

      {/* ── 특징 3개 ── */}
      <section className="max-w-5xl mx-auto w-full px-4 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { icon: '🔍', color: 'bg-blue-50', title: 'VIN 차대번호 조회', desc: '17자리 입력으로 내 차에 맞는 부품 자동 필터링' },
          { icon: '💰', color: 'bg-green-50', title: '사업자 등급 할인', desc: 'A/B/C 등급별 최대 할인가. 승인 후 즉시 적용' },
          { icon: '📦', color: 'bg-purple-50', title: '정품·OEM·애프터마켓', desc: '수입·국산 전 차종, 다양한 부품 등급을 한 곳에서' },
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
            <h2 className="text-xl font-bold text-black">🏆 베스트 상품</h2>
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
            <h2 className="text-xl font-bold text-black">✨ 신상품</h2>
            <Link href="/products?filter=new" className="text-sm text-blue-600 hover:underline">전체 보기</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {newProducts.map(p => <ProductCard key={p.id} product={p} price={calcPrice(p)} />)}
          </div>
        </section>
      )}

      {/* ── 사업자 배너 ── */}
      <section className="max-w-6xl mx-auto w-full px-4 pb-10">
        <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 200 }}>
          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=80"
            alt="car parts"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(15,23,42,0.9) 0%,rgba(15,23,42,0.4) 100%)' }} />
          <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-blue-300 text-sm font-medium mb-2">사업자 전용 특가</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">지금 사업자 등록하고</h3>
              <p className="text-slate-300">A/B/C 등급별 최대 할인가로 구매하세요</p>
            </div>
            <Link href="/signup" className="flex-shrink-0 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl px-8 py-3.5 transition-colors shadow-lg whitespace-nowrap">
              사업자 회원가입 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 회사 소개 ── */}
      <section className="max-w-5xl mx-auto w-full px-4 pb-14">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">광</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-black mb-2">{siteConfig.companyName || '광일통상'}</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {siteConfig.companyIntro || '국산 및 수입차종 부품(도·소매) 전문 업체입니다.\n정품, OEM, 애프터마켓 부품을 폭넓게 취급하며 사업자 등급별 특가를 제공합니다.'}
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
              {siteConfig.companyPhone && (
                <a href={`tel:${siteConfig.companyPhone}`} className="hover:text-blue-600 transition-colors">
                  📞 {siteConfig.companyPhone}
                </a>
              )}
              {siteConfig.businessHours && <span>🕐 {siteConfig.businessHours}</span>}
              {siteConfig.companyAddress && <span>📍 {siteConfig.companyAddress}</span>}
            </div>
            <div className="flex gap-3 mt-5">
              <Link href="/about" className="text-sm text-blue-600 hover:underline font-medium">회사소개 →</Link>
              <Link href="/location" className="text-sm text-blue-600 hover:underline font-medium">오시는 길 →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
