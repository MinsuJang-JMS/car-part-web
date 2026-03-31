'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SiteConfig {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  businessHours?: string;
  businessNumber?: string;
}

export default function Footer() {
  const [config, setConfig] = useState<SiteConfig>({});

  useEffect(() => {
    async function fetchConfig() {
      const snap = await getDoc(doc(db, 'siteConfig', 'main'));
      if (snap.exists()) setConfig(snap.data() as SiteConfig);
    }
    fetchConfig();
  }, []);

  const companyName = config.companyName || '광일통상';

  return (
    <footer className="border-t border-slate-200 mt-auto" style={{ background: '#1e293b' }}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* 회사 정보 */}
          <div className="sm:col-span-2">
            <p className="text-white font-bold text-lg mb-3">⚙️ {companyName}</p>
            <div className="flex flex-col gap-1.5 text-sm text-slate-400">
              {config.businessNumber && (
                <p>사업자등록번호: {config.businessNumber}</p>
              )}
              {config.companyAddress && (
                <p>📍 {config.companyAddress}</p>
              )}
              {config.companyPhone && (
                <p>📞 {config.companyPhone}</p>
              )}
              {config.businessHours && (
                <p>🕐 {config.businessHours}</p>
              )}
            </div>
          </div>

          {/* 바로가기 */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">바로가기</p>
            <div className="flex flex-col gap-2 text-sm text-slate-400">
              <a href="/products" className="hover:text-white transition-colors">전체상품</a>
              <a href="/categories" className="hover:text-white transition-colors">카테고리</a>
              <a href="/brands" className="hover:text-white transition-colors">브랜드</a>
              <a href="/vin" className="hover:text-white transition-colors">VIN 조회</a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
