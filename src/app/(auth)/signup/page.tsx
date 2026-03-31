'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signupIndividual, signupBusiness } from '@/lib/authActions';

type UserTypeSelection = 'individual' | 'business' | null;

const inputClass = "bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "text-sm font-medium text-black";

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserTypeSelection>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      if (userType === 'individual') {
        await signupIndividual(email, password, name, phone);
        router.push('/');
      } else if (userType === 'business') {
        await signupBusiness(email, password, name, phone, businessName, businessNumber);
        router.push('/pending');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (code === 'auth/weak-password') {
        setError('비밀번호는 6자 이상이어야 합니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!userType) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-black mb-2">회원가입</h1>
        <p className="text-sm text-gray-600 mb-8">가입 유형을 선택해주세요</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => setUserType('individual')}
            className="border-2 border-gray-200 rounded-xl p-5 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <p className="font-semibold text-black group-hover:text-blue-700">개인 회원</p>
            <p className="text-sm text-gray-600 mt-1">개인 고객으로 즉시 이용 가능합니다</p>
          </button>

          <button
            onClick={() => setUserType('business')}
            className="border-2 border-gray-200 rounded-xl p-5 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <p className="font-semibold text-black group-hover:text-blue-700">사업자 회원</p>
            <p className="text-sm text-gray-600 mt-1">담당자 승인 후 등급별 할인가 적용</p>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-700">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    );
  }

  const passwordMatch = passwordConfirm !== '' && password === passwordConfirm;
  const passwordMismatch = passwordConfirm !== '' && password !== passwordConfirm;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <button
        onClick={() => setUserType(null)}
        className="text-sm text-gray-700 hover:text-black mb-6 flex items-center gap-1"
      >
        ← 뒤로
      </button>

      <h1 className="text-2xl font-bold text-black mb-2">
        {userType === 'individual' ? '개인 회원가입' : '사업자 회원가입'}
      </h1>
      {userType === 'business' && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2 mb-6">
          가입 후 담당자 검토를 거쳐 승인됩니다 (1~2 영업일 소요)
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>이름</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="홍길동" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>이메일</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@email.com" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="6자 이상" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>비밀번호 확인</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            placeholder="비밀번호를 다시 입력하세요"
            className={inputClass + (passwordMismatch ? ' border-red-400 ring-2 ring-red-200' : passwordMatch ? ' border-green-400' : '')}
          />
          {passwordMismatch && (
            <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
          )}
          {passwordMatch && (
            <p className="text-xs text-green-600 mt-1">비밀번호가 일치합니다.</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>전화번호</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="010-0000-0000" className={inputClass} />
        </div>

        {userType === 'business' && (
          <>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>상호명</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="(주)홍길동자동차" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>사업자 등록번호</label>
              <input type="text" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} required placeholder="000-00-00000" className={inputClass} />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || passwordMismatch}
          className="mt-2 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
}
