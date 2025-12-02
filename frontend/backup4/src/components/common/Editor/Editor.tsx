// [파일명] Editor.tsx
// [설명] CMS 콘텐츠 및 게시글에서 공통으로 사용하는 리치 에디터 컴포넌트
// [작성일] [251014]
// [특징]
//   - react-draft-wysiwyg 기반
//   - 이미지 업로드 기능 포함 (FileController.uploadEditorImage 연동)
//   - 상위 컴포넌트로 HTML 반환(onChange)
//   - 콘텐츠 수정 시 기본값(defaultValue) 주입 가능

import React, { useState, useEffect, useRef } from "react"; // React 기본 훅 import (상태관리, DOM 접근용)
import { Editor } from "react-draft-wysiwyg"; // 리치 에디터 UI 컴포넌트 import
import { EditorState, ContentState, convertToRaw, ContentBlock } from "draft-js";  //& Draft.js 핵심 기능 import + ContentBlock 추가
import htmlToDraft from "html-to-draftjs";  // HTML → Draft 변환 모듈
import draftToHtml from "draftjs-to-html"; // Draft → HTML 변환 모듈
import apiCms from "../../../api/axiosCms"; // CMS 전용 Axios 인스턴스 import
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css"; // 리치 에디터 스타일 import
import "../../../css/all/EditorStyle.css" // 공통 CSS 적용

interface EditorProps {
  onChange?: (html: string) => void; // 상위 컴포넌트로 HTML 본문 전달용
  defaultValue?: string; // 수정 시 초기 콘텐츠 (HTML)
}

// & [이미지 렌더링 예외 처리] Draft.js의 entity 손실 방지를 위한 커스텀 블록 렌더러
function MediaComponent({ block, contentState }: any) {
  try {
    const entity = contentState.getEntity(block.getEntityAt(0)); // 이미지 entity 가져오기
    const { src, alt, height, width } = entity.getData(); // entity 데이터 추출
    const emptyHtml = " "; // 이미지 단독시 focus 문제 방지용
    return (
      <div>
        {emptyHtml}
        <img
          src={src}
          alt={alt || ""}
          style={{ height: height || "auto", width: width || "auto" }}
        />
      </div>
    );
  } catch (error) {
    console.error("⚠️ MediaComponent entity 오류:", error);
    return null; // entity가 없을 경우 렌더 생략
  }
}

// & [이미지 블록 렌더러] atomic 블록 감지 후 MediaComponent로 대체
function imageBlockRenderer(contentBlock: ContentBlock) {
  const type = contentBlock.getType();
  if (type === "atomic") {
    return {
      component: MediaComponent,
      editable: false,
    };
  }
  return null;
}

const EditorComponent: React.FC<EditorProps> = ({ onChange, defaultValue }) => {

  const [editorState, setEditorState] = useState(EditorState.createEmpty()); // Draft 에디터의 현재 상태 관리

  // * [</>코드보기] 코드보기 관련 상태 정의
  const [isCodeView, setIsCodeView] = useState(false); // 코드보기 토글 상태
  const [htmlCode, setHtmlCode] = useState(""); // 현재 HTML 원본 저장
  const editorWrapperRef = useRef<HTMLDivElement>(null); // Editor 전체 DOM 접근용 ref

  // [1] defaultValue가 존재할 때, HTML → Draft 변환하여 초기값 세팅
  useEffect(() => {
    if (defaultValue) {
      const blocksFromHtml = htmlToDraft(defaultValue); // HTML 문자열을 Draft 구조로 변환
      const { contentBlocks, entityMap } = blocksFromHtml; // 변환 결과에서 블록/엔티티 추출
      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap); // Draft ContentState 생성
      setEditorState(EditorState.createWithContent(contentState)); // EditorState 초기화
      setHtmlCode(defaultValue); // 코드보기 모드 대비 HTML 원본 저장
    }
  }, [defaultValue]);

  // [2] Draft 에디터 상태 변경 시 HTML 변환 및 상위 전달
  const onEditorStateChange = (state: EditorState) => {
    setEditorState(state); // 내부 상태 갱신
    const html = draftToHtml(convertToRaw(state.getCurrentContent())); // Draft 내용을 HTML로 변환
    setHtmlCode(html); // HTML 원본 동기화
    if (onChange) onChange(html); // 상위 컴포넌트로 콜백 전달
  };

  // [3] 이미지 업로드 콜백 (백엔드 FileController.uploadEditorImage 연동)
  const uploadImageCallBack = async (file: File) => {
    const formData = new FormData(); // 파일 업로드용 FormData 객체 생성
    formData.append("image", file); // formData에 파일 추가
    try {
      const response = await apiCms.post("/api/files/upload/editor", formData, { // 백엔드 API 요청
        headers: { "Content-Type": "multipart/form-data" }, // multipart 설정
      });
      const link = response.data?.data?.link; // 서버 응답에서 이미지 링크 추출
      console.log("이미지 업로드 성공:", link); // 업로드 성공 로그
      return Promise.resolve({ data: { link } }); // react-draft-wysiwyg 요구형식 반환
    } catch (err) {
      console.error("이미지 업로드 실패:", err); // 실패 로그
      return Promise.reject(err); // 에디터로 실패 응답 전달
    }
  };

  // * [</>코드보기] 토글 버튼 클릭 시 코드보기 상태 반전
  const toggleCodeView = () => {
    setIsCodeView((prev) => !prev); // true ↔ false 전환
  };

  // * [</>코드보기] textarea에서 변경된 내용 실시간 반영
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value; // textarea 입력값 추출
    setHtmlCode(newValue); // HTML 코드 상태 업데이트
    if (onChange) onChange(newValue); // 상위로 HTML 전달
  };

  // * [</>코드보기] 실제 DOM을 조작하여 입력창만 교체
  useEffect(() => {
    const wrapper = editorWrapperRef.current; // Editor 전체 DOM 가져오기
    if (!wrapper) return; // 예외 처리

    const contentArea = wrapper.querySelector(".rdw-editor-main") as HTMLElement; // 본문 입력영역 선택
    if (!contentArea) return;

    if (isCodeView) {
      // ⚠️ 코드보기 모드일 때: 본문 숨기고 textarea 표시
      contentArea.style.display = "none"; // Draft 본문 숨김
      let codeBox = wrapper.querySelector("#htmlViewBox") as HTMLTextAreaElement; // 기존 textarea 탐색
      if (!codeBox) {
        codeBox = document.createElement("textarea"); // 새 textarea 생성
        codeBox.id = "htmlViewBox"; // id 부여
        codeBox.value = htmlCode; // 현재 HTML 내용 삽입
        // textarea 스타일 지정 (입력창 크기/디자인)
        codeBox.style.width = "100%";
        codeBox.style.minHeight = "250px";
        codeBox.style.fontFamily = "monospace";
        codeBox.style.fontSize = "13px";
        codeBox.style.border = "1px solid #ddd";
        codeBox.style.padding = "8px";
        codeBox.style.borderRadius = "6px";
        codeBox.addEventListener("input", (e: any) => handleCodeChange(e)); // 입력 시 이벤트 연결
        contentArea.parentElement?.appendChild(codeBox); // 본문 아래에 textarea 삽입
      } else {
        codeBox.value = htmlCode; // 기존 textarea 업데이트
        codeBox.style.display = "block"; // 보이게 처리
      }
    } else {
      // ⚠️ 에디터 모드 복귀 시 textarea 숨기기
      contentArea.style.display = "block"; // Draft 본문 복구
      const codeBox = wrapper.querySelector("#htmlViewBox") as HTMLTextAreaElement; // textarea 탐색
      if (codeBox) codeBox.style.display = "none"; // 숨김 처리
    }
  }, [isCodeView, htmlCode]);

  // [4] 실제 에디터 화면 렌더링
  return (
    <div className="bg-white border rounded p-3" ref={editorWrapperRef}> {/* Editor 전체 영역 및 ref 연결 */}
      <Editor
        editorState={editorState} // Draft.js 상태 연결
        onEditorStateChange={onEditorStateChange} // 입력 변경 시 호출되는 핸들러
        wrapperClassName="demo-wrapper" // 전체 래퍼 CSS 클래스
        editorClassName="demo-editor min-h-[250px] bg-gray-50 p-2 rounded" // 에디터 본문 영역 스타일
        localization={{ locale: "ko" }} // 한글 설정
        customBlockRenderFunc={imageBlockRenderer} //& 이미지 엔티티 렌더러 등록
        toolbar={{ // 툴바 구성 옵션 정의
          options: [
            "inline", // Bold, Italic 등 인라인 스타일
            "blockType", // 제목/본문 블록 전환
            "fontSize", // 글자 크기 조정
            "list", // 리스트 기능
            "textAlign", // 정렬 옵션
            "colorPicker", // 색상 선택
            "link", // 링크 삽입
            "image", // 이미지 업로드
            "history", // 실행취소/되돌리기
          ],
          image: { // 이미지 업로드 관련 세부 설정
            uploadEnabled: true, // 업로드 기능 활성화
            urlEnabled: true, // URL 직접 입력 허용
            uploadCallback: uploadImageCallBack, // 이미지 업로드 콜백 지정
            previewImage: true, // 미리보기 활성화
            inputAccept: "image/gif,image/jpeg,image/jpg,image/png,image/svg", // 허용 확장자
            alt: { present: false, mandatory: false }, // 대체 텍스트 옵션 비활성
            defaultSize: { height: "auto", width: "auto" }, // 이미지 기본 크기 자동
          },
        }}
      />

      {/* //* [</>코드보기] 코드보기 토글 버튼 UI */}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsCodeView(false)}
          className={`code-toggle-btn ${!isCodeView ? "active" : ""}`}
        >
          Editor
        </button>

        <button
          type="button"
          onClick={() => setIsCodeView(true)}
          className={`code-toggle-btn ${isCodeView ? "active" : ""}`}
        >
          {"</> Code"}
        </button>
      </div>
      
    </div>
  );
};

export default EditorComponent; // 컴포넌트 내보내기 (다른 페이지에서 import 가능)
