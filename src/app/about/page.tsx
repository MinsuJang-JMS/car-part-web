'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface SiteConfig {
  companyName?: string;
  companyIntro?: string;
  companyAddress?: string;
  companyPhone?: string;
  businessHours?: string;
  businessNumber?: string;
}

const DEFAULT_INTRO = `광일통상은 국산 및 수입 차종의 자동차 부품을 도매 및 소매로 판매하는 전문 업체입니다.

정품, OEM, 애프터마켓 부품을 폭넓게 취급하며, 오랜 경험과 전문 지식을 바탕으로 고객의 차량에 가장 적합한 부품을 신속하게 공급합니다.

사업자 고객을 위한 B2B 특가 공급부터 일반 소비자 대상 소매 판매까지, 다양한 고객의 요구에 맞는 서비스를 제공합니다.`;

const FEATURES = [
  {
    icon: '🔩',
    title: '정품 / OEM / 애프터마켓',
    desc: '국산·수입차 전 차종에 맞는 정품, OEM, 애프터마켓 부품을 한 곳에서 구매하세요.',
  },
  {
    icon: '🏭',
    title: '도매 & 소매',
    desc: '개인 소비자부터 정비 업체, 부품 판매 업체까지 다양한 구매 규모에 대응합니다.',
  },
  {
    icon: '⚡',
    title: '빠른 공급',
    desc: '풍부한 재고와 빠른 물류로 필요한 부품을 신속하게 공급합니다.',
  },
  {
    icon: '🔍',
    title: 'VIN 정확 조회',
    desc: '차대번호(VIN) 17자리로 내 차에 맞는 부품만 정확하게 검색할 수 있습니다.',
  },
  {
    icon: '💰',
    title: '사업자 등급 할인',
    desc: 'A/B/C 등급별 특가를 제공합니다. 사업자 등록 후 즉시 혜택을 받으세요.',
  },
  {
    icon: '🛡️',
    title: '품질 보증',
    desc: '검증된 공급처에서 엄선한 부품만 판매하여 품질을 보장합니다.',
  },
];

export default function AboutPage() {
  const [config, setConfig] = useState<SiteConfig>({});

  useEffect(() => {
    getDoc(doc(db, 'siteConfig', 'main')).then(snap => {
      if (snap.exists()) setConfig(snap.data() as SiteConfig);
    });
  }, []);

  const companyName = config.companyName || '광일통상';
  const intro = config.companyIntro || DEFAULT_INTRO;

  return (
    <div className="flex flex-col flex-1">

      {/* 히어로 */}
      <section
        className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 60%, #0f172a 100%)' }}
      >
        <p className="text-blue-300 text-sm font-medium tracking-widest uppercase mb-3">국산 및 수입차부품 전문</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">{companyName}</h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-lg mx-auto">
          국산 및 수입차종 부품 도·소매<br />정품 · OEM · 애프터마켓
        </p>
      </section>

      {/* 회사 소개 */}
      <section className="max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            광
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-black mb-3">회사 소개</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{intro}</p>

            <div className="flex flex-wrap gap-4 mt-5 text-sm text-slate-500">
              {config.companyPhone && (
                <a href={`tel:${config.companyPhone}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                  📞 {config.companyPhone}
                </a>
              )}
              {config.businessHours && (
                <span className="flex items-center gap-1.5">🕐 {config.businessHours}</span>
              )}
              {config.companyAddress && (
                <span className="flex items-center gap-1.5">📍 {config.companyAddress}</span>
              )}
            </div>

            {config.businessNumber && (
              <p className="text-xs text-slate-400 mt-2">사업자등록번호: {config.businessNumber}</p>
            )}

            <Link
              href="/location"
              className="inline-flex items-center gap-2 mt-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition-colors"
            >
              📍 오시는 길 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 특징 */}
      <section className="max-w-5xl mx-auto w-full px-4 pb-12">
        <h2 className="text-xl font-bold text-black mb-6 text-center">왜 광일통상인가요?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto w-full px-4 pb-14">
        <div className="bg-slate-800 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">지금 바로 시작하세요</h3>
          <p className="text-slate-400 text-sm mb-6">회원가입 후 사업자 인증을 받으면 등급별 특가를 바로 이용할 수 있습니다.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl px-8 py-3 transition-colors">
              🔧 전체상품 보기
            </Link>
            <Link href="/location" className="border border-slate-500 text-slate-300 hover:border-slate-300 hover:text-white font-medium rounded-xl px-8 py-3 transition-all">
              📍 오시는 길
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
