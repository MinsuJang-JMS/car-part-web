'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  doc, getDoc, updateDoc, getDocs, orderBy, query, collection, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Product, Category, Brand } from '@/types';
import Link from 'next/link';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [fetching, setFetching] = useState(true);

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
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      const [catSnap, brandSnap, productSnap] = await Promise.all([
        getDocs(query(collection(db, 'categories'), orderBy('order'))),
        getDocs(query(collection(db, 'brands'), orderBy('name'))),
        getDoc(doc(db, 'products', id)),
      ]);
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Category));
      setBrands(brandSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand));

      if (productSnap.exists()) {
        const p = { id: productSnap.id, ...productSnap.data() } as Product;
        setProduct(p);
        setName(p.name);
        setBrand(p.brand ?? '');
        setDescription(p.description ?? '');
        setCategoryId(p.categoryId ?? '');
        setStock(String(p.stock));
        setCompatibleVehicles((p.compatibleVehicles ?? []).join('\n'));
        setPriceIndividual(String(p.prices.individual));
        setPriceA(String(p.prices.business_a));
        setPriceB(String(p.prices.business_b));
        setPriceC(String(p.prices.business_c));
        setIsBest(p.isBest ?? false);
        setIsNew(p.isNew ?? false);
        setExistingImageUrls(p.imageUrls ?? []);
      }
      setFetching(false);
    }
    fetchData();
  }, [id]);

  async function removeExistingImage(url: string) {
    try {
      await deleteObject(ref(storage, url));
    } catch {}
    setExistingImageUrls(prev => prev.filter(u => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setError('');
    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      if (newImageFiles) {
        for (const file of Array.from(newImageFiles)) {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          uploadedUrls.push(await getDownloadURL(storageRef));
        }
      }

      await updateDoc(doc(db, 'products', product.id), {
        name,
        brand: brand.trim() || null,
        description,
        categoryId,
        stock: Number(stock),
        compatibleVehicles: compatibleVehicles.split('\n').map(v => v.trim()).filter(Boolean),
        prices: {
          individual: Number(priceIndividual),
          business_a: Number(priceA),
          business_b: Number(priceB),
          business_c: Number(priceC),
        },
        isBest,
        isNew,
        imageUrls: [...existingImageUrls, ...uploadedUrls],
        updatedAt: serverTimestamp(),
      });

      router.push('/admin/products');
    } catch (err) {
      console.error(err);
      setError('수정 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || fetching) {
    return <div className="flex flex-1 items-center justify-center"><p className="text-gray-500 text-sm">불러오는 중...</p></div>;
  }
  if (!product || user?.userType !== 'admin') return null;

  const inputClass = "bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "text-sm font-medium text-black";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-black">← 상품 목록</Link>
        <h1 className="text-xl font-bold text-black">상품 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>상품명</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>브랜드</label>
          <input type="text" list="brand-options" value={brand} onChange={e => setBrand(e.target.value)} placeholder="브랜드 선택 또는 입력" className={inputClass} />
          <datalist id="brand-options">
            {brands.map(b => <option key={b.id} value={b.name} />)}
          </datalist>
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
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>재고 수량</label>
          <input type="number" value={stock} onChange={e => setStock(e.target.value)} required min="0" className={inputClass} />
        </div>

        <div>
          <p className={labelClass + ' mb-2'}>등급별 가격 (원)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">개인가</label>
              <input type="number" value={priceIndividual} onChange={e => setPriceIndividual(e.target.value)} required min="0" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">사업자 A</label>
              <input type="number" value={priceA} onChange={e => setPriceA(e.target.value)} required min="0" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">사업자 B</label>
              <input type="number" value={priceB} onChange={e => setPriceB(e.target.value)} required min="0" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">사업자 C</label>
              <input type="number" value={priceC} onChange={e => setPriceC(e.target.value)} required min="0" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>호환 차량 (줄바꿈으로 구분)</label>
          <textarea value={compatibleVehicles} onChange={e => setCompatibleVehicles(e.target.value)} rows={3} placeholder={"현대 아반떼 2020\n기아 K5 2019"} className={inputClass + ' resize-none'} />
        </div>

        {/* 기존 이미지 */}
        {existingImageUrls.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className={labelClass}>등록된 이미지</label>
            <div className="flex gap-2 flex-wrap">
              {existingImageUrls.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >×</button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">이미지에 마우스를 올려 × 버튼으로 삭제할 수 있습니다.</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={labelClass}>이미지 추가</label>
          <input type="file" accept="image/*" multiple onChange={e => setNewImageFiles(e.target.files)} className="text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-black hover:file:bg-gray-200" />
        </div>

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

        <div className="flex gap-3">
          <Link href="/admin/products" className="flex-1 text-center border border-gray-300 text-gray-600 rounded-lg py-3 text-sm font-medium hover:bg-gray-50 transition-colors">
            취소
          </Link>
          <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? '저장 중...' : '수정 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
