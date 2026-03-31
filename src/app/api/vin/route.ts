import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get('vin');
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: 'VIN은 17자리여야 합니다.' }, { status: 400 });
  }

  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin.toUpperCase()}?format=json`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('NHTSA API 오류');
    const data = await res.json();
    const result = data.Results?.[0];

    if (!result || result.ErrorCode !== '0') {
      return NextResponse.json({ error: '유효하지 않은 VIN 번호입니다.' }, { status: 422 });
    }

    return NextResponse.json({
      make: result.Make || '',
      model: result.Model || '',
      year: result.ModelYear || '',
      bodyClass: result.BodyClass || '',
      engineSize: result.DisplacementL ? `${parseFloat(result.DisplacementL).toFixed(1)}L` : '',
      fuelType: result.FuelTypePrimary || '',
      driveType: result.DriveType || '',
    });
  } catch {
    return NextResponse.json({ error: '차량 정보를 가져오는 데 실패했습니다.' }, { status: 500 });
  }
}
