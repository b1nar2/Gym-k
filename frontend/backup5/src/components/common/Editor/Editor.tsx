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

  // [251022] 이전 HTML 값을 저장하여 변경 시에만 onChange 호출하기 위한 useRef 선언
  const previousHtml = useRef<string>("");

  // [251022] 초기값 한 번만 세팅 여부 확인용 플래그
  const [initialized, setInitialized] = useState(false);

  // * [</>코드보기] 코드보기 관련 상태 정의
  const [isCodeView, setIsCodeView] = useState(false); // 코드보기 토글 상태
  const [htmlCode, setHtmlCode] = useState(""); // 현재 HTML 원본 저장
  const editorWrapperRef = useRef<HTMLDivElement>(null); // Editor 전체 DOM 접근용 ref

  // [1] defaultValue가 존재할 때, HTML → Draft 변환하여 초기값 세팅
  // [251022] 초기값을 한 번만 세팅하여 엔터 줄바꿈 시 상태 초기화 빈번 호출 문제 해결
  useEffect(() => {
    if (defaultValue && !initialized) {
      const blocksFromHtml = htmlToDraft(defaultValue);
      const { contentBlocks, entityMap } = blocksFromHtml;
      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
      setEditorState(EditorState.createWithContent(contentState));
      previousHtml.current = defaultValue; // 이전 HTML 초기화
      setHtmlCode(defaultValue);
      setInitialized(true);
    }
  }, [defaultValue, initialized]);

  // [2] Draft 에디터 상태 변경 시 HTML 변환 및 상위 전달
  // [251022] 변경된 HTML이 이전과 다를 때만 콜백 호출해 무한 루프 및 줄바꿈 문제 방지
  const onEditorStateChange = (state: EditorState) => {
    setEditorState(state);
    const html = draftToHtml(convertToRaw(state.getCurrentContent()));

    if (html !== previousHtml.current) {
      previousHtml.current = html;
      setHtmlCode(html);
      if (onChange) onChange(html);
    }
  };

  // [3] 이미지 업로드 콜백 (백엔드 FileController.uploadEditorImage 연동)
  const uploadImageCallBack = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await apiCms.post("/api/files/upload/editor", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let link = response.data?.data?.link;

      if (link && link.includes("/images/editor/")) {
        link = link.replace("/images/editor/", "/images/images/editor/");
      }
      if (!link.startsWith("http")) {
        link = "http://localhost:8181" + link;
      }

      console.log("이미지 업로드 성공:", link);
      return Promise.resolve({ data: { link } });
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      return Promise.reject(err);
    }
  };

  // * [</>코드보기] 토글 버튼 클릭 시 코드보기 상태 반전
  const toggleCodeView = () => {
    setIsCodeView((prev) => !prev);
  };

  // * [</>코드보기] textarea에서 변경된 내용 실시간 반영
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setHtmlCode(newValue);
    if (onChange) onChange(newValue);
  };

  // * [</>코드보기] 실제 DOM을 조작하여 입력창만 교체
  useEffect(() => {
    const wrapper = editorWrapperRef.current;
    if (!wrapper) return;

    const contentArea = wrapper.querySelector(".rdw-editor-main") as HTMLElement;
    if (!contentArea) return;

    if (isCodeView) {
      contentArea.style.display = "none";
      let codeBox = wrapper.querySelector("#htmlViewBox") as HTMLTextAreaElement;
      if (!codeBox) {
        codeBox = document.createElement("textarea");
        codeBox.id = "htmlViewBox";
        codeBox.value = htmlCode;
        codeBox.style.width = "100%";
        codeBox.style.minHeight = "250px";
        codeBox.style.fontFamily = "monospace";
        codeBox.style.fontSize = "13px";
        codeBox.style.border = "1px solid #ddd";
        codeBox.style.padding = "8px";
        codeBox.style.borderRadius = "6px";
        codeBox.addEventListener("input", (e: any) => handleCodeChange(e));
        contentArea.parentElement?.appendChild(codeBox);
      } else {
        codeBox.value = htmlCode;
        codeBox.style.display = "block";
      }
    } else {
      contentArea.style.display = "block";
      const codeBox = wrapper.querySelector("#htmlViewBox") as HTMLTextAreaElement;
      if (codeBox) codeBox.style.display = "none";
    }
  }, [isCodeView, htmlCode]);

  // [4] 실제 에디터 화면 렌더링
  return (
    <div className="bg-white border rounded p-3" ref={editorWrapperRef}>
      {/* Editor 전체 영역 및 ref 연결 */}
      <Editor
        editorState={editorState}
        onEditorStateChange={onEditorStateChange}
        wrapperClassName="demo-wrapper"
        editorClassName="demo-editor min-h-[250px] bg-gray-50 p-2 rounded"
        localization={{ locale: "ko" }}
        customBlockRenderFunc={imageBlockRenderer}
        toolbar={{
          options: [
            "inline",
            "blockType",
            "fontSize",
            "list",
            "textAlign",
            "colorPicker",
            "link",
            "image",
            "history",
          ],
          image: {
            uploadEnabled: true,
            urlEnabled: true,
            uploadCallback: uploadImageCallBack,
            previewImage: true,
            inputAccept: "image/gif,image/jpeg,image/jpg,image/png,image/svg",
            alt: { present: false, mandatory: false },
            defaultSize: { height: "auto", width: "auto" },
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
