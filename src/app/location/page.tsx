'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SiteConfig {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  businessHours?: string;
  mapEmbedUrl?: string;
  naverMapUrl?: string;
  kakaoMapUrl?: string;
  drivingInfo?: string;
  transitInfo?: string;
  parkingInfo?: string;
}

export default function LocationPage() {
  const [config, setConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'siteConfig', 'main')).then(snap => {
      if (snap.exists()) setConfig(snap.data() as SiteConfig);
      setLoading(false);
    });
  }, []);

  const companyName = config.companyName || '광일통상';

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-slate-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">

      {/* 상단 헤더 */}
      <section
        className="py-12 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 60%, #0f172a 100%)' }}
      >
        <p className="text-blue-300 text-sm font-medium tracking-widest uppercase mb-2">찾아오시는 길</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{companyName}</h1>
        {config.companyAddress && (
          <p className="text-slate-400 text-sm sm:text-base">{config.companyAddress}</p>
        )}
      </section>

      <div className="max-w-4xl mx-auto w-full px-4 py-10 flex flex-col gap-8">

        {/* 지도 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {config.mapEmbedUrl ? (
            <iframe
              src={config.mapEmbedUrl}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="오시는 길 지도"
            />
          ) : (
            <div className="h-64 bg-slate-100 flex flex-col items-center justify-center gap-3 text-slate-400">
              <span className="text-5xl">🗺️</span>
              <p className="text-sm">관리자 설정에서 지도 URL을 등록하면 여기에 지도가 표시됩니다.</p>
            </div>
          )}

          {/* 지도 버튼 */}
          {(config.naverMapUrl || config.kakaoMapUrl) && (
            <div className="p-4 flex gap-3 border-t border-slate-100">
              {config.naverMapUrl && (
                <a
                  href={config.naverMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
                >
                  <span>🗺️</span> 네이버 지도
                </a>
              )}
              {config.kakaoMapUrl && (
                <a
                  href={config.kakaoMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-sm font-medium rounded-xl py-2.5 transition-colors"
                >
                  <span>📍</span> 카카오맵
                </a>
              )}
            </div>
          )}
        </div>

        {/* 연락처 & 영업시간 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">📞 연락처</h3>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              {config.companyPhone ? (
                <a href={`tel:${config.companyPhone}`} className="hover:text-blue-600 transition-colors font-medium text-base">
                  {config.companyPhone}
                </a>
              ) : (
                <span className="text-slate-400">전화번호가 등록되지 않았습니다.</span>
              )}
              {config.companyAddress && (
                <p className="text-slate-500 mt-1">📍 {config.companyAddress}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">🕐 영업시간</h3>
            {config.businessHours ? (
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{config.businessHours}</p>
            ) : (
              <p className="text-sm text-slate-400">영업시간이 등록되지 않았습니다.</p>
            )}
          </div>
        </div>

        {/* 교통 안내 */}
        {(config.transitInfo || config.drivingInfo || config.parkingInfo) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-5">교통 안내</h3>
            <div className="flex flex-col gap-5">
              {config.transitInfo && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    🚇 대중교통
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{config.transitInfo}</p>
                </div>
              )}
              {config.transitInfo && config.drivingInfo && (
                <div className="border-t border-slate-100" />
              )}
              {config.drivingInfo && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    🚗 자가용
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{config.drivingInfo}</p>
                </div>
              )}
              {(config.transitInfo || config.drivingInfo) && config.parkingInfo && (
                <div className="border-t border-slate-100" />
              )}
              {config.parkingInfo && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    🅿️ 주차 안내
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{config.parkingInfo}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 교통 안내 미등록 시 */}
        {!config.transitInfo && !config.drivingInfo && !config.parkingInfo && (
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-center text-slate-400 text-sm">
            <p className="text-3xl mb-2">🚌</p>
            <p>관리자 설정에서 교통 안내를 등록하면 여기에 표시됩니다.</p>
          </div>
        )}

      </div>
    </div>
  );
}
