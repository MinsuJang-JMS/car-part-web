'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { logout } from '@/lib/authActions';
import { Category, Brand } from '@/types';

export default function Header() {
  const { user, loading } = useAuth();
  const { totalCount } = useCart();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function fetchNavData() {
      const [catSnap, brandSnap] = await Promise.all([
        getDocs(query(collection(db, 'categories'), orderBy('order'))),
        getDocs(query(collection(db, 'brands'), orderBy('name'))),
      ]);
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Category));
      setBrands(brandSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand));
    }
    fetchNavData();
  }, []);

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    router.push('/login');
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 shadow-md" style={{ background: 'linear-gradient(90deg, #1e293b 0%, #1e3a5f 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* 로고 + 데스크탑 네비 */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center" onClick={closeMobile}>
              <img src="/logo.png" alt="광일통상" className="h-14 w-auto" style={{ mixBlendMode: 'screen', filter: 'contrast(2) brightness(1.2)' }} />
            </Link>

            <nav className="hidden sm:flex items-center gap-1">

              {/* 브랜드 드롭다운 */}
              <div className="relative group">
                <button className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 flex items-center gap-1 transition-all">
                  브랜드
                  <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="py-1">
                    <Link href="/brands" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium">
                      전체 브랜드
                    </Link>
                    {brands.length > 0 && <div className="border-t border-gray-100 my-1" />}
                    {brands.map(brand => (
                      <Link key={brand.id} href={`/brands/${encodeURIComponent(brand.name)}`} className="block px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        {brand.name}
                      </Link>
                    ))}
                    {brands.length === 0 && <p className="px-4 py-2 text-xs text-gray-400">등록된 브랜드 없음</p>}
                  </div>
                </div>
              </div>

              <Link href="/products" className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all">전체상품</Link>

              {/* 부품 카테고리 드롭다운 */}
              <div className="relative group">
                <button className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 flex items-center gap-1 transition-all">
                  부품 카테고리
                  <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="py-1">
                    <Link href="/categories" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium">
                      전체 카테고리
                    </Link>
                    {categories.length > 0 && <div className="border-t border-gray-100 my-1" />}
                    {categories.map(cat => (
                      <Link key={cat.id} href={`/categories/${cat.id}`} className="block px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        {cat.name}
                      </Link>
                    ))}
                    {categories.length === 0 && <p className="px-4 py-2 text-xs text-gray-400">등록된 카테고리 없음</p>}
                  </div>
                </div>
              </div>

              <Link href="/vin" className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all">VIN 조회</Link>
              <Link href="/about" className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all">회사소개</Link>
              <Link href="/location" className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all">오시는 길</Link>
            </nav>
          </div>

          {/* 우측: 장바구니 + 인증 메뉴 + 햄버거 버튼 */}
          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative p-2 text-slate-300 hover:text-white transition-colors" onClick={closeMobile}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </Link>
            {!loading && user ? (
              <>
                {user.userType === 'admin' && (
                  <Link href="/admin" className="text-xs bg-amber-400 text-slate-900 font-semibold rounded-lg px-3 py-1.5 hover:bg-amber-300 transition-colors">
                    관리자
                  </Link>
                )}
                <span className="text-sm text-slate-300 hidden sm:block">{user.name}님</span>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-all"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-4 py-1.5 transition-all">
                  로그인
                </Link>
                <Link href="/signup" className="hidden sm:block text-sm bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg px-4 py-1.5 transition-colors shadow-sm">
                  회원가입
                </Link>
              </>
            )}

            {/* 햄버거 버튼 (모바일 전용) */}
            <button
              className="sm:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label="메뉴"
            >
              <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-40 flex flex-col" style={{ top: '64px' }}>
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/40" onClick={closeMobile} />

          {/* 메뉴 패널 */}
          <div className="relative w-full shadow-xl overflow-y-auto" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #1e3a5f 100%)', maxHeight: 'calc(100vh - 64px)' }}>
            <nav className="px-4 py-3 flex flex-col divide-y divide-white/10">

              <Link href="/products" onClick={closeMobile} className="py-3.5 text-white font-medium text-sm">전체상품</Link>

              {/* 브랜드 */}
              <div className="py-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">브랜드</p>
                <Link href="/brands" onClick={closeMobile} className="block py-2 text-sm text-slate-300 hover:text-white">전체 브랜드</Link>
                {brands.map(brand => (
                  <Link key={brand.id} href={`/brands/${encodeURIComponent(brand.name)}`} onClick={closeMobile} className="block py-2 text-sm text-slate-400 hover:text-white pl-3">
                    {brand.name}
                  </Link>
                ))}
              </div>

              {/* 카테고리 */}
              <div className="py-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">부품 카테고리</p>
                <Link href="/categories" onClick={closeMobile} className="block py-2 text-sm text-slate-300 hover:text-white">전체 카테고리</Link>
                {categories.map(cat => (
                  <Link key={cat.id} href={`/categories/${cat.id}`} onClick={closeMobile} className="block py-2 text-sm text-slate-400 hover:text-white pl-3">
                    {cat.name}
                  </Link>
                ))}
              </div>

              <Link href="/vin" onClick={closeMobile} className="py-3.5 text-white font-medium text-sm">🔍 VIN 조회</Link>
              <Link href="/about" onClick={closeMobile} className="py-3.5 text-slate-300 text-sm">회사소개</Link>
              <Link href="/location" onClick={closeMobile} className="py-3.5 text-slate-300 text-sm">오시는 길</Link>
              <Link href="/cart" onClick={closeMobile} className="py-3.5 text-slate-300 text-sm flex items-center gap-2">
                장바구니
                {totalCount > 0 && <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">{totalCount}</span>}
              </Link>
              {user && <Link href="/my-orders" onClick={closeMobile} className="py-3.5 text-slate-300 text-sm">내 주문 현황</Link>}

              {/* 로그인/로그아웃 */}
              <div className="py-4 flex flex-col gap-2">
                {!loading && user ? (
                  <>
                    <p className="text-sm text-slate-400">{user.name}님 로그인 중</p>
                    <button onClick={handleLogout} className="w-full text-sm text-slate-300 border border-slate-600 rounded-xl py-2.5 hover:bg-white/10 transition-colors">
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={closeMobile} className="block text-center text-sm text-slate-300 border border-slate-600 rounded-xl py-2.5 hover:bg-white/10 transition-colors">
                      로그인
                    </Link>
                    <Link href="/signup" onClick={closeMobile} className="block text-center text-sm bg-blue-500 text-white font-medium rounded-xl py-2.5 hover:bg-blue-400 transition-colors">
                      회원가입
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
