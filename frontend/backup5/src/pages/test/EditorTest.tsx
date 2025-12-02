// [파일명] EditorTest.tsx
// [설명] 리치 에디터 독립 테스트 페이지
// [작성일] [251014]

import React from "react";
import CustomEditor from "../../components/common/Editor/Editor";

export default function EditorTest() {
  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white rounded shadow p-8">
      <CustomEditor />
    </div>
  );
}
