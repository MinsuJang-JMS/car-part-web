import { NextRequest, NextResponse } from 'next/server';

// 한국 제조사 WMI 코드 (차대번호 앞 3자리)
const KOREAN_WMI: Record<string, string> = {
  KMH: '현대',   // Hyundai
  KMY: '현대',
  KMF: '현대',
  KMT: '제네시스', // Genesis
  KMA: '제네시스',
  KNA: '기아',   // Kia
  KNB: '기아',
  KNC: '기아',
  KND: '기아',
  KNE: '기아',
  PLM: 'KGM',   // 구 쌍용
  KLY: '르노코리아',
  KLE: '르노코리아',
  KPT: 'GM 한국', // 쉐보레 한국
};

function isKoreanVin(vin: string): boolean {
  return vin.substring(0, 3).toUpperCase() in KOREAN_WMI;
}

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  bodyClass: string;
  engineSize: string;
  fuelType: string;
  driveType: string;
  source: 'nhtsa' | 'korean';
}

// 공공데이터포털 API 호출 (국토교통부 자동차 정보)
async function fetchKoreanVin(vin: string): Promise<VehicleInfo | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://apis.data.go.kr/1613000/VehicleInfoInquireService/getVehicleInfoByVinNum?serviceKey=${encodeURIComponent(apiKey)}&vinNum=${vin}&type=json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const item = data?.response?.body?.item;
    if (!item) return null;

    const wmi = vin.substring(0, 3).toUpperCase();
    const manufacturerName = KOREAN_WMI[wmi] || item.mkerNm || '';

    // 배기량 → 리터 변환 (cc → L)
    const displacement = item.dsplVl
      ? `${(parseInt(item.dsplVl) / 1000).toFixed(1)}L`
      : '';

    return {
      make: item.mkerNm || manufacturerName,
      model: item.vhclNm || '',
      year: item.yridFrst?.substring(0, 4) || '',
      bodyClass: item.vhclKndNm || '',
      engineSize: displacement,
      fuelType: item.mtFuelNm || '',
      driveType: '',
      source: 'korean',
    };
  } catch {
    return null;
  }
}

// NHTSA API 호출 (미국 NHTSA)
async function fetchNhtsaVin(vin: string): Promise<VehicleInfo | null> {
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const result = data.Results?.[0];
    // ErrorCode '0'이 아니어도 Make가 있으면 부분 데이터 반환 (신차/미등록 차량 대응)
    if (!result || !result.Make) return null;

    return {
      make: result.Make || '',
      model: result.Model || '',
      year: result.ModelYear || '',
      bodyClass: result.BodyClass || '',
      engineSize: result.DisplacementL
        ? `${parseFloat(result.DisplacementL).toFixed(1)}L`
        : '',
      fuelType: result.FuelTypePrimary || '',
      driveType: result.DriveType || '',
      source: 'nhtsa',
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get('vin');
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: 'VIN은 17자리여야 합니다.' }, { status: 400 });
  }

  const cleaned = vin.trim().toUpperCase();
  let result: VehicleInfo | null = null;

  if (isKoreanVin(cleaned)) {
    // 한국 차대번호 → 공공데이터포털 먼저, 실패하면 NHTSA
    result = await fetchKoreanVin(cleaned);
    if (!result) {
      // API 키 없거나 실패 시: WMI에서 제조사만 채워서 NHTSA 시도
      result = await fetchNhtsaVin(cleaned);
      if (result && !result.make) {
        result.make = KOREAN_WMI[cleaned.substring(0, 3)] || '';
      }
    }
  } else {
    // 외국 차 → NHTSA
    result = await fetchNhtsaVin(cleaned);
  }

  if (!result || (!result.make && !result.model)) {
    return NextResponse.json(
      { error: '차량 정보를 찾을 수 없습니다. 차대번호를 확인해주세요.' },
      { status: 422 }
    );
  }

  return NextResponse.json(result);
}
