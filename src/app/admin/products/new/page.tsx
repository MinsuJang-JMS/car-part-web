'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, addDoc, getDocs, orderBy, query, serverTimestamp, where, limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Category, Brand } from '@/types';
import Link from 'next/link';

export default function NewProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('');
  const [compatibleVehicles, setCompatibleVehicles] = useState('');
  const [priceIndividual, setPriceIndividual] = useState('');
  const [priceA, setPriceA] = useState('');
  const [priceB, setPriceB] = useState('');
  const [priceC, setPriceC] = useState('');
  const [isBest, setIsBest] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      const [catSnap, brandSnap] = await Promise.all([
        getDocs(query(collection(db, 'categories'), orderBy('order'))),
        getDocs(query(collection(db, 'brands'), orderBy('name'))),
      ]);
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Category));
      setBrands(brandSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand));
    }
    fetchData();
  }, []);

  async function ensureBrand(brandName: string) {
    const trimmed = brandName.trim();
    if (!trimmed) return;
    const existing = await getDocs(
      query(collection(db, 'brands'), where('name', '==', trimmed), limit(1))
    );
    if (existing.empty) {
      await addDoc(collection(db, 'brands'), { name: trimmed, createdAt: serverTimestamp() });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      if (imageFiles) {
        for (const file of Array.from(imageFiles)) {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          imageUrls.push(await getDownloadURL(storageRef));
        }
      }

      if (brand.trim()) await ensureBrand(brand);

      await addDoc(collection(db, 'products'), {
        name,
        brand: brand.trim() || null,
        description,
        categoryId,
        imageUrls,
        stock: Number(stock),
        compatibleVehicles: compatibleVehicles.split('\n').map(v => v.trim()).filter(Boolean),
        prices: {
          individual: Number(priceIndividual),
          business_a: Number(priceA),
          business_b: Number(priceB),
          business_c: Number(priceC),
        },
        isActive: true,
        isBest,
        isNew,
        createdAt: serverTimestamp(),
        createdBy: user!.uid,
      });

      router.push('/admin');
    } catch {
      setError('상품 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user?.userType !== 'admin') return null;

  const inputClass = "bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "text-sm font-medium text-black";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-black">← 관리자</Link>
        <h1 className="text-xl font-bold text-black">상품 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>상품명</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="상품명을 입력하세요" className={inputClass} />
        </div>

        {/* 브랜드 — datalist로 기존 브랜드 자동완성 + 신규 입력 가능 */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>브랜드</label>
          <input
            type="text"
            list="brand-options"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder="브랜드를 선택하거나 새로 입력하세요"
            className={inputClass}
          />
          <datalist id="brand-options">
            {brands.map(b => <option key={b.id} value={b.name} />)}
          </datalist>
          <p className="text-xs text-gray-500">기존 브랜드를 선택하거나 새 브랜드명을 직접 입력하면 자동 등록됩니다.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>카테고리</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className={inputClass}>
            <option value="">카테고리 선택</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>상품 설명</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="상품 설명을 입력하세요" className={inputClass + ' resize-none'} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>재고 수량</label>
          <input type="number" value={stock} onChange={e => setStock(e.target.value)} required min="0" placeholder="0" className={inputClass} />
        </div>

        <div>
          <p className={labelClass + ' mb-2'}>등급별 가격 (원)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">개인가</label>
              <input type="number" value={priceIndividual} onChange={e => setPriceIndividual(e.target.value)} required min="0" placeholder="0" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">사업자 A</label>
              <input type="number" value={priceA} onChange={e => setPriceA(e.target.value)} required min="0" placeholder="0" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">사업자 B</label>
              <input type="number" value={priceB} onChange={e => setPriceB(e.target.value)} required min="0" placeholder="0" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">사업자 C</label>
              <input type="number" value={priceC} onChange={e => setPriceC(e.target.value)} required min="0" placeholder="0" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>호환 차량 (줄바꿈으로 구분)</label>
          <textarea value={compatibleVehicles} onChange={e => setCompatibleVehicles(e.target.value)} rows={3} placeholder={"현대 아반떼 2020\n기아 K5 2019"} className={inputClass + ' resize-none'} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>상품 이미지</label>
          <input type="file" accept="image/*" multiple onChange={e => setImageFiles(e.target.files)} className="text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-black hover:file:bg-gray-200" />
        </div>

        {/* 홈 노출 태그 */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>홈 노출 설정</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-black cursor-pointer">
              <input type="checkbox" checked={isBest} onChange={e => setIsBest(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              베스트 상품
            </label>
            <label className="flex items-center gap-2 text-sm text-black cursor-pointer">
              <input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              신상품
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

        <button type="submit" disabled={submitting} className="bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {submitting ? '등록 중...' : '상품 등록'}
        </button>
      </form>
    </div>
  );
}
