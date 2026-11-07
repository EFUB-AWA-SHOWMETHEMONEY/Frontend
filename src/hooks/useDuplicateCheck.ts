import { useState } from 'react';

export type DuplicateField = 'loginId' | 'nickname';
export type DuplicateStatus = 'idle' | 'pending' | 'available' | 'taken' | 'error';

// TODO(API 연동): 아이디, 닉네임 중복 확인 요청. 지금은 항상 사용 가능으로 처리
async function checkDuplicate(
  field: DuplicateField,
  value: string,
): Promise<{ available: boolean }> {
  void field;
  void value;
  return { available: true };
}

interface CheckResult {
  value: string;
  status: Exclude<DuplicateStatus, 'idle'>;
}

// 중복 확인 응답을 기다리는 사이에 입력이 바뀌었을 경우, 해당 응답 자동 무시
export function useDuplicateCheck(field: DuplicateField, value: string) {
  const [result, setResult] = useState<CheckResult | null>(null);

  const status: DuplicateStatus = result?.value === value ? result.status : 'idle';

  const check = async () => {
    const requested = value;
    setResult({ value: requested, status: 'pending' });
    try {
      const { available } = await checkDuplicate(field, requested);
      setResult((prev) =>
        prev?.value === requested
          ? { value: requested, status: available ? 'available' : 'taken' }
          : prev,
      );
    } catch {
      setResult((prev) =>
        prev?.value === requested ? { value: requested, status: 'error' } : prev,
      );
    }
  };

  return { status, check };
}
