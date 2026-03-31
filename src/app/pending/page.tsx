'use client';

import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/authActions';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⏳</span>
        </div>

        <h1 className="text-xl font-bold text-black mb-2">승인 대기 중</h1>
        <p className="text-sm text-gray-700 mb-6">
          {user?.businessName && (
            <span className="font-medium text-black">{user.businessName}</span>
          )}
          {user?.businessName ? ' 으로 ' : ''}
          사업자 가입 신청이 접수되었습니다.
          <br />
          담당자 검토 후 승인되면 이메일로 안내드립니다.
          <br />
          <span className="text-gray-500">(보통 1~2 영업일 소요)</span>
        </p>

        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 text-sm text-gray-800">
          <p className="font-medium text-black mb-2">신청 정보</p>
          <p>이름: {user?.name}</p>
          <p>이메일: {user?.email}</p>
          {user?.businessName && <p>상호명: {user.businessName}</p>}
          {user?.businessNumber && <p>사업자번호: {user.businessNumber}</p>}
        </div>

        <button
          onClick={handleLogout}
          className="w-full border border-gray-300 rounded-lg py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
