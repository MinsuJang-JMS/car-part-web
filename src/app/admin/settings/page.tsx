'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface SiteConfig {
  companyName: string;
  companyIntro: string;
  companyAddress: string;
  companyPhone: string;
  businessHours: string;
  businessNumber: string;
}

const empty: SiteConfig = {
  companyName: '', companyIntro: '', companyAddress: '',
  companyPhone: '', businessHours: '', businessNumber: '',
};

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig>(empty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchConfig() {
      const snap = await getDoc(doc(db, 'siteConfig', 'main'));
      if (snap.exists()) setConfig({ ...empty, ...snap.data() });
    }
    fetchConfig();
  }, []);

  function update(key: keyof SiteConfig, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await setDoc(doc(db, 'siteConfig', 'main'), config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || user?.userType !== 'admin') return null;

  const inputClass = "bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "text-sm font-medium text-black";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-black">← 관리자</Link>
        <h1 className="text-xl font-bold text-black">사이트 설정</h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-black border-b border-gray-100 pb-3">회사 정보</h2>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>회사명</label>
            <input type="text" value={config.companyName} onChange={e => update('companyName', e.target.value)} placeholder="광일통상" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>회사 소개글</label>
            <textarea value={config.companyIntro} onChange={e => update('companyIntro', e.target.value)} rows={3} placeholder="회사 소개 문구를 입력하세요" className={inputClass + ' resize-none'} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>주소</label>
            <input type="text" value={config.companyAddress} onChange={e => update('companyAddress', e.target.value)} placeholder="서울시 강남구 ..." className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>대표 전화</label>
            <input type="text" value={config.companyPhone} onChange={e => update('companyPhone', e.target.value)} placeholder="02-000-0000" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>영업시간</label>
            <input type="text" value={config.businessHours} onChange={e => update('businessHours', e.target.value)} placeholder="평일 09:00~18:00 / 토·일·공휴일 휴무" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>사업자등록번호</label>
            <input type="text" value={config.businessNumber} onChange={e => update('businessNumber', e.target.value)} placeholder="000-00-00000" className={inputClass} />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
        </button>
      </form>
    </div>
  );
}
