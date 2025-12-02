//! [파일명] FileUploadInput.tsx
//! [설명] 첨부파일 자동 업로드 컴포넌트 (파일 선택 시 즉시 업로드 실행)
//! [작성일] [251010]
//! [적용화면] CmsFacilityForm.tsx 등 (공용 업로드용)

import React, { useState } from "react"; // [1] React 기본 훅(useState) import: 상태값(파일, 업로드상태) 관리용

// [2] FileUploadInput 컴포넌트 시작
// - targetType : 어떤 종류의 데이터에 속한 파일인지 (예: facility, board 등)
// - targetId : 대상의 PK (예: 시설ID, 게시글ID 등)
// - apiInstance : axiosCms 또는 axios (요청 보낼 인스턴스)
// - onUploadSuccess : 업로드 완료 후 부모 컴포넌트에 경로 전달용 콜백
export default function FileUploadInput({
  targetType,
  targetId,
  apiInstance,
  onUploadSuccess,
}: {
  targetType: string; // [3] 파일 대상 종류 (facility 등)
  targetId: number;   // [4] 파일이 속한 데이터의 고유ID
  apiInstance: any;   // [5] axios 인스턴스 (토큰/기본 URL 포함)
  onUploadSuccess?: (path: string) => void; // [6] 업로드 성공 시 호출될 함수(경로 전달)
}) {

  const [file, setFile] = useState<File | null>(null); // [7] 현재 선택된 파일 상태값 (초기값 null)
  const [loading, setLoading] = useState(false);       // [8] 업로드 중 여부 상태 (true=업로드 중)

  // [9] 파일 선택 시 자동으로 업로드 실행되는 이벤트 핸들러
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null; // [9-1] input에서 첫 번째 파일 추출
    if (!selectedFile) return; // [9-2] 파일 없으면 종료
    setFile(selectedFile); // [9-3] 선택한 파일을 상태로 저장

    setLoading(true); // [9-4] 업로드 시작 표시 (버튼 비활성화 등)
    try {
      const formData = new FormData(); // [9-5] FormData 생성 (multipart/form-data용)
      formData.append("file", selectedFile); // [9-6] 업로드할 실제 파일 추가
      formData.append("fileTargetType", targetType); // [9-7] 대상 타입 추가 (예: facility)
      formData.append("fileTargetId", String(targetId)); // [9-8] 대상 ID를 문자열로 변환하여 추가

      // [9-9] 서버로 업로드 요청 전송
      const res = await apiInstance.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }, // [9-10] 전송 헤더 지정
      });

      // [9-11] 서버 응답에서 파일 저장 경로 추출
      const savedPath =
        res.data?.data?.filePath ||
        res.data?.filePath ||
        res.data?.path ||
        "";

      // [9-12] 부모 컴포넌트로 저장 경로 전달
      if (onUploadSuccess && savedPath) {
        onUploadSuccess(savedPath);
      }

      console.log("[FileUploadInput] 업로드 완료:", savedPath); // [9-13] 디버깅 로그 출력
      alert("파일 업로드가 완료되었습니다 ✅"); // [9-14] 사용자 알림
    } catch (err) {
      console.error("[FileUploadInput] 업로드 실패:", err); // [9-15] 에러 로그 출력
      alert("업로드 중 오류가 발생했습니다 ❌"); // [9-16] 오류 알림
    } finally {
      setLoading(false); // [9-17] 업로드 완료 후 로딩 상태 해제
    }
  };

  // [10] JSX 반환 (컴포넌트 UI 구성)
  return (
    <div className="flex flex-col gap-2 p-3 border rounded-md bg-white"> {/* [10-1] 영역 전체 박스 */}
      <label className="font-semibold text-gray-700">첨부파일 업로드</label> {/* [10-2] 제목 라벨 */}

      {/* [10-3] 파일 선택 input (선택 즉시 업로드 자동 실행) */}
      <input
        type="file"
        onChange={handleFileChange} // [10-4] 파일 선택 시 handleFileChange 실행
        disabled={loading} // [10-5] 업로드 중에는 비활성화
        className="border p-2 rounded-md text-sm"
      />

      {/* [10-6] 업로드 진행 중 표시 */}
      {loading && <p className="text-sm text-gray-500">업로드 중...</p>}

      {/* [10-7] 업로드 완료 후 선택된 파일명 표시 */}
      {file && !loading && (
        <p className="text-sm text-gray-500">
          선택된 파일: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  );
}
