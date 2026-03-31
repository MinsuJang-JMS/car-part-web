'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  orderBy, query, where, limit, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Brand, BrandCategory } from '@/types';
import Link from 'next/link';

// ── 초기 OEM 브랜드 시드 데이터 ─────────────────────────────
const SEED_OEM: { name: string; category: BrandCategory }[] = [
  { name: 'PHC Valeo', category: 'oem' },
  { name: 'DRB', category: 'oem' },
  { name: '평화오일씰공업', category: 'oem' },
  { name: 'DYG', category: 'oem' },
];

const CATEGORY_LABELS: Record<BrandCategory, string> = {
  import: '외제차 정품',
  domestic: '국산차 정품',
  oem: 'OEM',
};

const CATEGORY_COLORS: Record<BrandCategory, string> = {
  import: 'bg-blue-100 text-blue-700',
  domestic: 'bg-green-100 text-green-700',
  oem: 'bg-amber-100 text-amber-700',
};

interface EditState {
  id: string;
  name: string;
  category: BrandCategory;
  imageUrl: string;
}

export default function AdminBrandsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BrandCategory>('import');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  const [editState, setEditState] = useState<EditState | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && user?.userType !== 'admin') router.replace('/');
  }, [user, loading, router]);

  async function fetchBrands() {
    const snap = await getDocs(query(collection(db, 'brands'), orderBy('name')));
    setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand));
  }

  useEffect(() => { fetchBrands(); }, []);

  // ── 이미지 업로드 ────────────────────────────────────────────
  async function uploadImage(file: File): Promise<string> {
    const storageRef = ref(storage, `brands/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  // ── 브랜드 추가 ──────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError('');
    setSubmitting(true);
    try {
      const existing = await getDocs(
        query(collection(db, 'brands'), where('name', '==', trimmed), limit(1))
      );
      if (!existing.empty) {
        setError('이미 존재하는 브랜드입니다.');
        return;
      }
      let url = imageUrl.trim();
      if (imageFile) url = await uploadImage(imageFile);
      await addDoc(collection(db, 'brands'), {
        name: trimmed,
        category,
        imageUrl: url || null,
        createdAt: serverTimestamp(),
      });
      setName('');
      setImageUrl('');
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await fetchBrands();
    } finally {
      setSubmitting(false);
    }
  }

  // ── OEM 시드 일괄 등록 ───────────────────────────────────────
  async function handleSeedOem() {
    if (!confirm('PHC Valeo, DRB, 평화오일씰공업, DYG를 OEM 브랜드로 등록하시겠습니까?')) return;
    setSeeding(true);
    for (const seed of SEED_OEM) {
      const existing = await getDocs(
        query(collection(db, 'brands'), where('name', '==', seed.name), limit(1))
      );
      if (existing.empty) {
        await addDoc(collection(db, 'brands'), {
          name: seed.name,
          category: seed.category,
          imageUrl: null,
          createdAt: serverTimestamp(),
        });
      }
    }
    await fetchBrands();
    setSeeding(false);
  }

  // ── 브랜드 삭제 ──────────────────────────────────────────────
  async function handleDelete(id: string, brandName: string) {
    if (!confirm(`"${brandName}" 브랜드를 삭제하시겠습니까?`)) return;
    await deleteDoc(doc(db, 'brands', id));
    await fetchBrands();
  }

  // ── 브랜드 수정 저장 ─────────────────────────────────────────
  async function handleEditSave() {
    if (!editState) return;
    setEditSaving(true);
    try {
      let url = editState.imageUrl;
      if (editFile) url = await uploadImage(editFile);
      await updateDoc(doc(db, 'brands', editState.id), {
        name: editState.name.trim(),
        category: editState.category,
        imageUrl: url || null,
      });
      setEditState(null);
      setEditFile(null);
      if (editFileRef.current) editFileRef.current.value = '';
      await fetchBrands();
    } finally {
      setEditSaving(false);
    }
  }

  if (loading || user?.userType !== 'admin') return null;

  const inputClass = "bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const selectClass = inputClass;

  const grouped: Record<BrandCategory, Brand[]> = { import: [], domestic: [], oem: [] };
  brands.forEach(b => {
    const cat: BrandCategory = (['import', 'domestic', 'oem'] as BrandCategory[]).includes(b.category)
      ? b.category : 'import';
    grouped[cat].push(b);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-black">← 관리자</Link>
          <h1 className="text-xl font-bold text-black">브랜드 관리</h1>
        </div>
        <button
          onClick={handleSeedOem}
          disabled={seeding}
          className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg px-3 py-2 font-medium transition-colors disabled:opacity-50"
        >
          {seeding ? '등록 중...' : '⚡ OEM 기본 브랜드 등록'}
        </button>
      </div>

      {/* 브랜드 추가 폼 */}
      <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex flex-col gap-4">
        <h2 className="font-semibold text-black text-sm">브랜드 추가</h2>

        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="브랜드명 (예: Mercedes-Benz, 현대, Bosch)"
            className={inputClass + ' flex-1'}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value as BrandCategory)}
            className={selectClass + ' w-36'}
          >
            <option value="import">외제차 정품</option>
            <option value="domestic">국산차 정품</option>
            <option value="oem">OEM</option>
          </select>
        </div>

        <div className="flex gap-3 items-start">
          <input
            type="text"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="이미지 URL (Unsplash 등) 또는 아래서 파일 선택"
            className={inputClass + ' flex-1'}
          />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 transition-colors"
            >
              {imageFile ? `📎 ${imageFile.name.slice(0, 12)}...` : '파일 선택'}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors self-end"
        >
          {submitting ? '추가 중...' : '브랜드 추가'}
        </button>
      </form>

      {/* 수정 모달 */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-black">브랜드 수정</h3>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">브랜드명</label>
              <input
                type="text"
                value={editState.name}
                onChange={e => setEditState(s => s && { ...s, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">카테고리</label>
              <select
                value={editState.category}
                onChange={e => setEditState(s => s && { ...s, category: e.target.value as BrandCategory })}
                className={selectClass}
              >
                <option value="import">외제차 정품</option>
                <option value="domestic">국산차 정품</option>
                <option value="oem">OEM</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">이미지 URL</label>
              <input
                type="text"
                value={editState.imageUrl}
                onChange={e => setEditState(s => s && { ...s, imageUrl: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">이미지 파일 교체</label>
              <div className="flex gap-2 items-center">
                <input ref={editFileRef} type="file" accept="image/*"
                  onChange={e => setEditFile(e.target.files?.[0] ?? null)} className="hidden" />
                <button
                  type="button"
                  onClick={() => editFileRef.current?.click()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 transition-colors"
                >
                  {editFile ? `📎 ${editFile.name.slice(0, 16)}...` : '파일 선택'}
                </button>
                {editState.imageUrl && !editFile && (
                  <img src={editState.imageUrl} alt="preview" className="w-12 h-8 object-cover rounded" />
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => { setEditState(null); setEditFile(null); }}
                className="text-sm text-gray-500 hover:text-black px-4 py-2"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {editSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 브랜드 목록 (카테고리별) */}
      {(['import', 'domestic', 'oem'] as BrandCategory[]).map(cat => (
        <div key={cat} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[cat]}`}>
              {CATEGORY_LABELS[cat]}
            </span>
            <span className="text-xs text-gray-400">{grouped[cat].length}개</span>
          </div>

          {grouped[cat].length === 0 ? (
            <p className="text-sm text-gray-400 pl-2 py-3">등록된 브랜드가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {grouped[cat].map(brand => (
                <div key={brand.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  {/* 이미지 미리보기 */}
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {brand.imageUrl
                      ? <img src={brand.imageUrl} alt={brand.name} className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-400">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                    }
                  </div>
                  <span className="text-sm font-medium text-black flex-1">{brand.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditState({
                        id: brand.id,
                        name: brand.name,
                        category: brand.category ?? 'import',
                        imageUrl: brand.imageUrl ?? '',
                      })}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id, brand.name)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {brands.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-8">
          등록된 브랜드가 없습니다. 위에서 추가하거나 <strong>OEM 기본 브랜드 등록</strong>을 눌러보세요.
        </p>
      )}
    </div>
  );
}
