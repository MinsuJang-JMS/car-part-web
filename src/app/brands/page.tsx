'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Brand, BrandCategory } from '@/types';
import Link from 'next/link';

const CATEGORY_META: Record<BrandCategory, { label: string; badgeCls: string }> = {
  import:   { label: '외제차 정품', badgeCls: 'bg-blue-100 text-blue-700' },
  domestic: { label: '국산차 정품', badgeCls: 'bg-green-100 text-green-700' },
  oem:      { label: 'OEM',        badgeCls: 'bg-amber-100 text-amber-700' },
};

const FALLBACK_BG: Record<BrandCategory, string> = {
  import:   'linear-gradient(135deg,#0c1a2e,#1e3a5f)',
  domestic: 'linear-gradient(135deg,#002c5f,#005baa)',
  oem:      'linear-gradient(135deg,#1a1a1a,#333)',
};

function BrandCard({ brand }: { brand: Brand }) {
  const cat: BrandCategory = (['import', 'domestic', 'oem'] as BrandCategory[]).includes(brand.category)
    ? brand.category : 'import';
  const meta = CATEGORY_META[cat];

  return (
    <Link
      href={`/brands/${encodeURIComponent(brand.name)}`}
      className="relative block overflow-hidden rounded-2xl group aspect-[3/4]"
    >
      {brand.imageUrl ? (
        <img
          src={brand.imageUrl}
          alt={brand.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: FALLBACK_BG[cat] }} />
      )}
      <div
        className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-80"
        style={{ background: 'linear-gradient(160deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.3) 60%,transparent 100%)' }}
      />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full ${meta.badgeCls}`}>
          {meta.label}
        </span>
        <p className="text-white font-bold text-base leading-tight drop-shadow">{brand.name}</p>
      </div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-sm bg-white/20 rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm">→</span>
      </div>
    </Link>
  );
}

export default function BrandsPage() {
  const [grouped, setGrouped] = useState<Record<BrandCategory, Brand[]>>({
    import: [], domestic: [], oem: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      const snap = await getDocs(query(collection(db, 'brands'), orderBy('name')));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand);
      const g: Record<BrandCategory, Brand[]> = { import: [], domestic: [], oem: [] };
      all.forEach(b => {
        const cat: BrandCategory = (['import', 'domestic', 'oem'] as BrandCategory[]).includes(b.category)
          ? b.category : 'import';
        g[cat].push(b);
      });
      setGrouped(g);
      setLoading(false);
    }
    fetchBrands();
  }, []);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><p className="text-gray-500 text-sm">불러오는 중...</p></div>;
  }

  const total = grouped.import.length + grouped.domestic.length + grouped.oem.length;

  return (
    <div className="w-full px-4 sm:px-8 py-8 max-w-screen-2xl mx-auto">
      <h1 className="text-2xl font-bold text-black mb-8">브랜드</h1>

      {total === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🏷️</p>
          <p>등록된 브랜드가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {(['import', 'domestic', 'oem'] as BrandCategory[]).map(cat => {
            const brands = grouped[cat];
            if (brands.length === 0) return null;
            const meta = CATEGORY_META[cat];
            return (
              <section key={cat}>
                <div className="flex items-center gap-3 mb-5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.badgeCls}`}>{meta.label}</span>
                  <span className="text-sm text-slate-400">{brands.length}개 브랜드</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                  {brands.map(brand => <BrandCard key={brand.id} brand={brand} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
