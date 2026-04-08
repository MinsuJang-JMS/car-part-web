'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export default function MyAccountPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  // 기본 정보
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  async function handleInfoSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || infoSaving) return;
    setInfoSaving(true);
    setInfoSuccess(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), { name, phone });
      await refreshUser();
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setInfoSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (newPassword.length < 6) {
      setPwError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!auth.currentUser || !user) return;
    setPwSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPwError('현재 비밀번호가 올바르지 않습니다.');
      } else {
        setPwError('비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setPwSaving(false);
    }
  }

  if (loading || !user) return null;

  const gradeLabel = user.userType === 'business'
    ? `사업자 ${user.businessGrade?.toUpperCase() ?? ''} 등급`
    : user.userType === 'admin' ? '관리자' : '개인 회원';

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">회원 정보</h1>

      {/* 계정 현황 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
          {user.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-black">{user.name}</p>
          <p className="text-xs text-blue-600">{user.email} · {gradeLabel}</p>
          {user.businessName && <p className="text-xs text-gray-500 mt-0.5">{user.businessName}</p>}
        </div>
      </div>

      {/* 기본 정보 변경 */}
      <form onSubmit={handleInfoSave} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="font-semibold text-black mb-4">기본 정보</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">연락처</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400"
              placeholder="010-0000-0000"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">이메일</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="border border-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">이메일은 변경할 수 없습니다.</p>
          </div>
        </div>

        {infoSuccess && (
          <p className="text-sm text-green-600 font-medium mt-3">저장되었습니다.</p>
        )}

        <button
          type="submit"
          disabled={infoSaving}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {infoSaving ? '저장 중...' : '정보 저장'}
        </button>
      </form>

      {/* 비밀번호 변경 */}
      <form onSubmit={handlePasswordChange} className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="font-semibold text-black mb-4">비밀번호 변경</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">현재 비밀번호</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400"
              placeholder="6자 이상"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-black focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {pwError && <p className="text-sm text-red-500 mt-3">{pwError}</p>}
        {pwSuccess && <p className="text-sm text-green-600 font-medium mt-3">비밀번호가 변경되었습니다.</p>}

        <button
          type="submit"
          disabled={pwSaving}
          className="w-full mt-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {pwSaving ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
}
