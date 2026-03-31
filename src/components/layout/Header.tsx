'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/authActions';
import { Category, Brand } from '@/types';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

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
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 shadow-md" style={{ background: "linear-gradient(90deg, #1e293b 0%, #1e3a5f 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* 로고 + 네비 */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="광일통상" className="h-10 w-auto" />
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
                    <Link
                      key={brand.id}
                      href={`/brands/${encodeURIComponent(brand.name)}`}
                      className="block px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {brand.name}
                    </Link>
                  ))}
                  {brands.length === 0 && (
                    <p className="px-4 py-2 text-xs text-gray-400">등록된 브랜드 없음</p>
                  )}
                </div>
              </div>
            </div>

            {/* 전체상품 */}
            <Link
              href="/products"
              className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
            >
              전체상품
            </Link>

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
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      className="block px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  {categories.length === 0 && (
                    <p className="px-4 py-2 text-xs text-gray-400">등록된 카테고리 없음</p>
                  )}
                </div>
              </div>
            </div>

            {/* VIN 조회 */}
            <Link
              href="/vin"
              className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
            >
              VIN 조회
            </Link>

            {/* 회사소개 */}
            <Link
              href="/about"
              className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
            >
              회사소개
            </Link>

            {/* 오시는 길 */}
            <Link
              href="/location"
              className="text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
            >
              오시는 길
            </Link>
          </nav>
        </div>

        {/* 우측 인증 메뉴 */}
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              {user.userType === 'admin' && (
                <Link href="/admin" className="text-xs bg-amber-400 text-slate-900 font-semibold rounded-lg px-3 py-1.5 hover:bg-amber-300 transition-colors">
                  관리자
                </Link>
              )}
              <span className="text-sm text-slate-300 hidden sm:block">{user.name}님</span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-all"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-4 py-1.5 transition-all">
                로그인
              </Link>
              <Link href="/signup" className="text-sm bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg px-4 py-1.5 transition-colors shadow-sm">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
