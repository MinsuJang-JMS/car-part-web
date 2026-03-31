'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const menuItems = [
  { href: '/admin/products', icon: '📋', title: '상품 목록', desc: '등록된 상품 조회, 활성화/숨기기, 삭제' },
  { href: '/admin/products/new', icon: '📦', title: '상품 등록', desc: '새 상품을 등록합니다' },
  { href: '/admin/users', icon: '👥', title: '사업자 승인', desc: '가입 신청한 사업자를 검토합니다' },
  { href: '/admin/categories', icon: '🗂️', title: '카테고리 관리', desc: '상품 카테고리를 추가/삭제합니다' },
  { href: '/admin/brands', icon: '🏷️', title: '브랜드 관리', desc: '외제차/국산차/OEM 브랜드 추가·수정·삭제' },
  { href: '/admin/settings', icon: '⚙️', title: '사이트 설정', desc: '회사명, 주소, 전화번호, 오시는 길 등' },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  if (loading || user?.userType !== 'admin') return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-1">관리자 대시보드</h1>
      <p className="text-sm text-gray-600 mb-8">안녕하세요, {user.name}님</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-sm transition-all group"
          >
            <p className="text-3xl mb-3">{item.icon}</p>
            <p className="font-semibold text-black group-hover:text-blue-600">{item.title}</p>
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
