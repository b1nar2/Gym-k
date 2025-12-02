// [파일명] Editor.tsx
// [설명] CMS 콘텐츠 및 게시글에서 공통으로 사용하는 리치 에디터 컴포넌트
// [작성일] [251014]
// [특징]
//   - react-draft-wysiwyg 기반
//   - 이미지 업로드 기능 포함 (FileController.uploadEditorImage 연동)
//   - 상위 컴포넌트로 HTML 반환(onChange)
//   - 콘텐츠 수정 시 기본값(defaultValue) 주입 가능


import React, { useState, useEffect, useRef } from "react"; // React 및 기본 훅(상태, 라이프사이클, 참조) import
import { Editor } from "react-draft-wysiwyg"; // 리치 에디터 UI 컴포넌트 import
import { EditorState, ContentState, convertToRaw, ContentBlock } from "draft-js";  // Draft.js 에디터 상태/내용 관리 도구 import
import htmlToDraft from "html-to-draftjs";  // HTML을 Draft.js 형식으로 변환하는 라이브러리 import
import draftToHtml from "draftjs-to-html"; // Draft.js 형식을 HTML로 변환하는 라이브러리 import
import apiCms from "../../../api/axiosCms"; // CMS용 axios 인스턴스 import
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css"; // 에디터 기본 CSS import
import "../../../css/all/EditorStyle.css" // 커스텀 에디터 CSS import

interface EditorProps {

  onChange?: (html: string) => void; // 내용 변경 시 부모 컴포넌트로 HTML을 전달하는 함수
  defaultValue?: string; // 수정 모드 시 에디터에 표시될 초기 HTML 내용
}

// & [이미지 렌더링 예외 처리] Draft.js의 entity 손실 방지를 위한 커스텀 블록 렌더러
function MediaComponent({ block, contentState }: any) { // 이미지 블록을 렌더링할 커스텀 컴포넌트
  try { // 오류 발생을 대비한 try-catch 블록
    const entity = contentState.getEntity(block.getEntityAt(0)); // 블록에서 이미지 정보(entity)를 가져옴
    const { src, alt, height, width } = entity.getData(); // 이미지의 URL, 설명, 크기 등을 추출
    const emptyHtml = " "; // 이미지 주변에 공백을 두어 포커스 문제를 방지
    return (
      <div>
        {emptyHtml}
        <img
          src={src} // 이미지 소스(URL) 설정
          alt={alt || ""} // 대체 텍스트 설정 (없으면 빈 문자열)
          style={{ height: height || "auto", width: width || "auto" }} // 이미지 높이/너비 스타일 설정
        />
      </div>
    );
  } catch (error) {
    console.error("⚠️ MediaComponent entity 오류:", error); // 오류 발생 시 콘솔에 로그 출력
    return null; // 오류 발생 시 이미지를 렌더링하지 않음
  }
}

// & [이미지 블록 렌더러] atomic 블록 감지 후 MediaComponent로 대체
function imageBlockRenderer(contentBlock: ContentBlock) { // 특정 블록을 어떻게 그릴지 결정하는 함수
  const type = contentBlock.getType(); // 현재 블록의 타입(문단, 헤더, 이미지 등)을 가져옴
  if (type === "atomic") { // 블록 타입이 'atomic'(이미지 등 독립적인 콘텐츠)일 경우
    return {
      component: MediaComponent, // 이 블록을 그릴 때 사용할 React 컴포넌트를 지정
      editable: false, // 해당 블록은 사용자가 직접 편집할 수 없도록 설정
    };
  }
  return null; // 'atomic' 타입이 아니면 기본 렌더링 방식을 따름
}

const EditorComponent: React.FC<EditorProps> = ({ onChange, defaultValue }) => { // 메인 에디터 컴포넌트

  const [editorState, setEditorState] = useState(EditorState.createEmpty()); // 에디터의 내용, 커서, 히스토리 등을 관리하는 상태

  // [251022] 추가: 이전 HTML 값을 저장해 불필요한 리렌더 방지
  const previousHtml = useRef<string>(""); // 렌더링과 관계없이 이전 HTML 값을 기억하는 변수

  // [251022] 추가: 초기화 여부 확인용
  const [initialized, setInitialized] = useState(false); // defaultValue가 한 번 적용되었는지 확인하는 상태

  // * [</>코드보기] 코드보기 관련 상태 정의
  const [isCodeView, setIsCodeView] = useState(false); // 코드보기 토글 상태
  const [htmlCode, setHtmlCode] = useState(""); // 현재 HTML 원본 저장
  const editorWrapperRef = useRef<HTMLDivElement>(null); // 에디터 전체 div에 접근하기 위한 ref

  // [1] defaultValue가 존재할 때, HTML → Draft 변환하여 초기값 세팅
  // ⚠️ [old] 기존 로직: 매번 defaultValue 변경 시마다 상태 재생성 → 커서 점프 문제 발생
  /*
  useEffect(() => {
    if (defaultValue) {
      const blocksFromHtml = htmlToDraft(defaultValue); // HTML 문자열을 Draft 구조로 변환
      const { contentBlocks, entityMap } = blocksFromHtml; // 변환 결과에서 블록/엔티티 추출
      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap); // Draft ContentState 생성
      setEditorState(EditorState.createWithContent(contentState)); // EditorState 초기화
      setHtmlCode(defaultValue); // 코드보기 모드 대비 HTML 원본 저장
    }
  }, [defaultValue]);
  */

  // ✅ [251022] 수정: 초기값을 한 번만 세팅해 엔터/스페이스 시 화면 깜빡임 방지
  useEffect(() => { // defaultValue나 initialized 값이 바뀔 때마다 실행되는 Hook
    if (defaultValue && !initialized) { // 부모에게 받은 초기값(defaultValue)이 있고, 아직 초기화되지 않았을 때
      const blocksFromHtml = htmlToDraft(defaultValue); // HTML 코드를 Draft.js가 이해하는 구조로 변환
      const { contentBlocks, entityMap } = blocksFromHtml; // 변환된 데이터에서 블록과 엔티티를 추출
      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap); // 추출한 정보로 에디터 내용(ContentState) 생성
      setEditorState(EditorState.createWithContent(contentState)); // 생성된 내용으로 에디터 상태를 업데이트
      previousHtml.current = defaultValue; // 이전 값으로 현재 HTML 저장
      setHtmlCode(defaultValue); // 코드 보기(textarea)에도 초기값 설정
      setInitialized(true); // 초기화 완료로 표시하여 이 로직이 다시 실행되지 않도록 함
    }
  }, [defaultValue, initialized]); // 의존성 배열: 이 값들이 바뀔 때만 함수가 실행됨

  // [2] Draft 에디터 상태 변경 시 HTML 변환 및 상위 전달
  // ⚠️ [old] 원래 코드: 매 입력마다 상위 콜백 호출 → 엔터 시 무한 리렌더 및 깜빡임 유발
  /*
  const onEditorStateChange = (state: EditorState) => {
    setEditorState(state); // 내부 상태 갱신
    const html = draftToHtml(convertToRaw(state.getCurrentContent())); // Draft 내용을 HTML로 변환
    setHtmlCode(html); // HTML 원본 동기화
    if (onChange) onChange(html); //! 💀 [251021] 상위 컴포넌트로 콜백 전달 → 무한 반복 때문에 에디터 작성이 잘 안됨 💀
  };
  */

  // ✅ [251022] 수정: 내용이 실제로 변경된 경우에만 onChange 호출
  const onEditorStateChange = (state: EditorState) => { // 에디터 내용이 변경될 때마다 호출되는 함수
    setEditorState(state); // 에디터의 내부 상태를 최신으로 업데이트
    const html = draftToHtml(convertToRaw(state.getCurrentContent())); // 현재 에디터 내용을 HTML 코드로 변환
    if (html !== previousHtml.current) { // 실제 내용에 변경이 있을 때만 아래 로직 실행
      previousHtml.current = html; // 이전 HTML 값을 현재 값으로 업데이트
      setHtmlCode(html); // 코드 보기(textarea)의 내용도 동기화
      if (onChange) onChange(html); // 부모 컴포넌트로 변경된 HTML을 전달
    }
  };

  // [3] 이미지 업로드 콜백 (백엔드 FileController.uploadEditorImage 연동)
  const uploadImageCallBack = async (file: File) => { // 이미지 업로드 시 실행될 함수
    const formData = new FormData(); // 파일 업로드용 FormData 객체 생성
    formData.append("image", file); // 'image'라는 이름으로 파일 추가
    try {
      const response = await apiCms.post("/api/files/upload/editor", formData, { // 백엔드에 이미지 업로드 요청
        headers: { "Content-Type": "multipart/form-data" }, // 파일 전송을 위한 헤더 설정
      });

      // ⚠️ [old] 상대경로 처리 누락
      // let link = response.data?.data?.link;

      // ✅ [251021 + 251022] 절대경로로 교정
      let link = response.data?.data?.link; // 서버 응답에서 이미지 링크 추출
      if (link && link.includes("/images/editor/")) { // 경로에 문제가 있을 경우 보정
        link = link.replace("/images/editor/", "/images/images/editor/"); // (예시: 이중 경로 수정)
      }
      if (!link.startsWith("http")) { // 상대 경로일 경우
        link = "http://localhost:8181" + link; // 서버 주소를 붙여 절대 경로로 만듦
      }
      console.log("이미지 업로드 성공:", link); // 성공 로그 출력
      return Promise.resolve({ data: { link } }); // 에디터 라이브러리가 요구하는 형식으로 성공 결과 반환
    } catch (err) {
      console.error("이미지 업로드 실패:", err); // 실패 로그 출력
      return Promise.reject(err); // 에디터에 실패를 알림
    }
  };

  // * [</>코드보기] 토글 버튼 클릭 시 코드보기 상태 반전
  const toggleCodeView = () => { // '코드 보기' 버튼 클릭 시 실행될 함수
    setIsCodeView((prev) => !prev); // isCodeView 상태를 true -> false 또는 false -> true로 변경
  };

  // * [</>코드보기] textarea에서 변경된 내용 실시간 반영
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { // textarea 내용이 바뀔 때 실행될 함수
    const newValue = e.target.value; // textarea에 입력된 최신 값을 가져옴
    setHtmlCode(newValue); // htmlCode 상태를 최신 값으로 업데이트
    if (onChange) onChange(newValue); // 부모 컴포넌트에도 변경된 내용을 즉시 전달
  };

  // * [</>코드보기] 실제 DOM을 조작하여 입력창만 교체
  useEffect(() => { // isCodeView 또는 htmlCode 상태가 변경될 때마다 실행
    const wrapper = editorWrapperRef.current; // 에디터 전체를 감싸는 div 요소
    if (!wrapper) return; // wrapper가 없으면 중단
    const contentArea = wrapper.querySelector(".rdw-editor-main") as HTMLElement; // 에디터의 실제 입력 영역
    if (!contentArea) return; // 입력 영역이 없으면 중단

    if (isCodeView) { // '코드 보기' 모드일 때
      contentArea.style.display = "none"; // 기존 리치 에디터 숨기기
      let codeBox = wrapper.querySelector("#htmlViewBox") as HTMLTextAreaElement; // 기존에 생성된 textarea가 있는지 확인
      if (!codeBox) { // textarea가 없다면 새로 생성
        codeBox = document.createElement("textarea"); // textarea 요소 생성
        codeBox.id = "htmlViewBox"; // CSS 스타일링을 위한 id 부여
        codeBox.value = htmlCode; // 현재 HTML 코드를 값으로 설정
        codeBox.style.width = "100%"; // 너비 100%
        codeBox.style.minHeight = "250px"; // 최소 높이
        codeBox.style.fontFamily = "monospace"; // 코드용 글꼴
        codeBox.style.fontSize = "13px"; // 글자 크기
        codeBox.style.border = "1px solid #ddd"; // 테두리
        codeBox.style.padding = "8px"; // 내부 여백
        codeBox.style.borderRadius = "6px"; // 모서리 둥글게
        codeBox.addEventListener("input", (e: any) => handleCodeChange(e)); // 내용이 바뀔 때마다 handleCodeChange 함수 실행
        contentArea.parentElement?.appendChild(codeBox); // 리치 에디터 영역 옆에 textarea 추가
      } else {
        codeBox.value = htmlCode; // 이미 생성된 textarea가 있다면 내용만 업데이트
        codeBox.style.display = "block"; // 숨겨져 있던 textarea를 다시 보여줌
      }
    } else { // '에디터' 모드일 때
      contentArea.style.display = "block"; // 기존 리치 에디터 보여주기
      const codeBox = wrapper.querySelector("#htmlViewBox") as HTMLTextAreaElement; // textarea를 찾아서
      if (codeBox) codeBox.style.display = "none"; // 숨김
    }
  }, [isCodeView, htmlCode]); // 의존성 배열: 이 값들이 바뀔 때마다 함수가 실행됨

  // [4] 실제 에디터 화면 렌더링
  return (
    <div className="bg-white border rounded p-3" ref={editorWrapperRef}> {/* 에디터 전체 컨테이너 및 ref 연결 */}
      <Editor
        editorState={editorState} // 에디터의 현재 상태를 연결
        onEditorStateChange={onEditorStateChange} // 내용이 변경될 때 호출될 함수 연결
        wrapperClassName="demo-wrapper" // 에디터 전체를 감싸는 div의 클래스 이름
        editorClassName="demo-editor min-h-[250px] bg-gray-50 p-2 rounded" // 실제 입력창의 클래스 이름
        localization={{ locale: "ko" }} // 언어를 한국어로 설정
        customBlockRenderFunc={imageBlockRenderer} // 커스텀 이미지 렌더링 함수 연결
        toolbar={{ // 상단 툴바 옵션 설정
          options: [
            "inline", // 볼드, 이탤릭 등
            "blockType", // 제목1, 제목2, 문단 등
            "fontSize",
            "list",
            "textAlign",
            "colorPicker",
            "link",
            "image",
            "history", // 실행 취소, 다시 실행
          ],
          image: { // 이미지 관련 세부 설정
            uploadEnabled: true, // 파일 업로드 기능 활성화
            urlEnabled: true, // 이미지 URL 직접 입력 기능 활성화
            uploadCallback: uploadImageCallBack, // 이미지 업로드 시 실행될 함수 연결
            previewImage: true, // 업로드 전 이미지 미리보기 활성화
            inputAccept: "image/gif,image/jpeg,image/jpg,image/png,image/svg", // 허용할 이미지 파일 확장자
            alt: { present: false, mandatory: false }, // 대체 텍스트(alt) 입력창 비활성화
            defaultSize: { height: "auto", width: "auto" }, // 이미지 기본 크기 자동
          },
        }}
      />

      {/* //* [</>코드보기] 코드보기 토글 버튼 UI */}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsCodeView(false)} // 'Editor' 버튼 클릭 시 코드 보기 비활성화
          className={`code-toggle-btn ${!isCodeView ? "active" : ""}`} // 활성화 상태에 따라 다른 스타일 적용
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setIsCodeView(true)} // 'Code' 버튼 클릭 시 코드 보기 활성화
          className={`code-toggle-btn ${isCodeView ? "active" : ""}`} // 활성화 상태에 따라 다른 스타일 적용
        >
          {"</> Code"}
        </button>
      </div>
    </div>
  );
};
export default EditorComponent; // 컴포넌트 내보내기 (다른 페이지에서 import 가능)
