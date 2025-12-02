//! [설명] CMS 콘텐츠 등록·수정 겸용 화면 (폼 입력형)
//! [작성일] [251011]
//! [연동 API]
//!   - POST /api/cms/contents : 신규 등록
//!   - PUT  /api/cms/contents/{contentId} : 수정
//! [호출 위치] CmsApp.tsx → <Route path="contents/form" element={<CmsContentForm />} />
//^ [251013] 📝리치에디터 추가
//* [251013] 💾첨부파일 기능

// [1] 기본 설정 (React 훅, 라우터, axios)
import React, { useEffect, useState } from "react"; // React 기본 훅
import { useNavigate, useSearchParams } from "react-router-dom"; // URL 파라미터 및 페이지 이동
import api from "../../../api/axiosCms"; // CMS 전용 Axios 인스턴스
//import Editor from "../../../components/common/Editor/Editor"; // 서머노트는 구버전 리엑트에서만 지원되서 안사용함

//^ 📝------------------------------------ [리치에디터] import ---------------------------------------
import Editor from "../../../components/common/Editor/Editor"; // [251014] 공용 리치 에디터 import
//^ 📝------------------------------------ [리치에디터] import ---------------------------------------

//* 💾------------------------------------ [파일업로드] import ---------------------------------------
// [251013] 첨부파일 업로드 컴포넌트
import FileUploadInput from "../../../components/FileUploadInput"; //* [251010]💾 공용 업로드 컴포넌트 import
import apiCms from "../../../api/axiosCms"; //* [251010]💾 CMS 전용 axios 인스턴스 import
import "draft-js/dist/Draft.css"; // ⚠️ [필수] Draft.js 내부 스타일 없으면 버튼 무반응
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css"; // 에디터 CSS 적용
//* 💾------------------------------------ [파일업로드] import ---------------------------------------

// [1-1] 콘텐츠 데이터 구조 정의
interface ContentForm {
    contentId?: number;      // 수정 시에만 존재
    contentTitle: string;    // 콘텐츠 제목
    contentContent: string;  // 콘텐츠 내용
    contentType: string;     // 콘텐츠 구분(이용안내/상품안내)
    contentUse: string;      // 사용여부(Y/N)
    contentNum: number;      // 정렬번호
    contentFilePath?: string; //* [251013] 💾 첨부파일
}

// [2] 상태 관리 및 초기 로딩
export default function CmsContentForm() {
    console.log("🟢 CmsContentForm 렌더 시작");         // [log] 컴포넌트 자체가 실행되는지 확인
    const navigate = useNavigate();                    // 페이지 이동용
    const [searchParams] = useSearchParams();          // URL 파라미터 가져오기
    const contentId = searchParams.get("contentId");   // 수정 시 contentId 존재
    const isEditMode = !!contentId;                    // 수정모드 여부 판단

    // [2-1] 초기 상태 정의
    const [form, setForm] = useState<ContentForm>({
        contentTitle: "",
        contentContent: "",
        contentType: "이용안내",
        contentUse: "Y",
        contentNum: 0,
        contentFilePath: "", // * [251013] 💾 첨부파일 경로 상태 추가
    });

    // [2-2] 수정 모드일 경우 기존 데이터 불러오기
    useEffect(() => {
        console.log("useEffect 실행됨, isEditMode:", isEditMode, "contentId:", contentId);
        if (isEditMode) {
            api.get(`/api/cms/contents/${contentId}`)
                .then((res) => {
                    console.log("콘텐츠 데이터 불러오기 성공:", res.data);
                    const c = res.data.data.content;
                    setForm({
                        contentId: c.contentId,
                        contentTitle: c.contentTitle,
                        contentContent: c.contentContent,
                        contentType: c.contentType,
                        contentUse: c.contentUse,
                        contentNum: c.contentNum,
                    });

                })
                .catch((err) => {
                    console.error("콘텐츠 불러오기 실패:", err);
                    alert("콘텐츠 정보를 불러오지 못했습니다.");
                });
        }
    }, [isEditMode, contentId]);

    // [3] 입력 Form 구성 (Tailwind 기반 입력 UI)
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    //^ 📝------------------------------- [리치에디터] Draft → HTML 변환 및 상태 반영 ----------------------------------
    // ✅ [251014] 공용 에디터에서 HTML을 onChange로 직접 전달받음
    const handleEditorChange = (html: string) => {
        console.log("handleEditorChange 호출됨, HTML 길이:", html.length);
        setForm((prev) => ({ ...prev, contentContent: html }));
    }
    //^ 📝------------------------------- [리치에디터] Draft → HTML 변환 및 상태 반영 ----------------------------------

    // [4] 저장 처리 (등록·수정 구분)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // 기본 form 제출(새로고침) 동작을 막음 — React는 수동으로 처리해야 함
        console.log("handleSubmit 실행됨");

        const params = new URLSearchParams(); // 백엔드가 요구하는 전송 형식(application/x-www-form-urlencoded)을 사용하기 위한 객체 생성

        /*  백엔드에서 @RequestParam이나 @ModelAttribute로 값을 받을 때 application/x-www-form-urlencoded 형식으로 전달할 경우
            ! JSON방식인 FormData()으로 전달하면 에러 발생함
            * URLSearchParams은 주소창에 붙는 형식을 토큰키로 인코딩해줄 수 있음 
            ^ FormData() 대신 URLSearchParams()를 사용하면, 자동으로 'application/x-www-form-urlencoded' 형식으로 인코딩됨
        */
        params.append("contentTitle", form.contentTitle); // 제목 데이터 추가
        params.append("contentContent", form.contentContent); // 본문(내용) 데이터 추가
        params.append("contentType", form.contentType); // 콘텐츠 유형(이용안내 / 상품안내) 추가
        params.append("contentUse", form.contentUse); // 사용여부(Y/N) 추가
        params.append("contentNum", String(form.contentNum)); // 정렬번호를 문자열로 변환하여 추가 (숫자는 문자열로 보내야 함)
        if (form.contentFilePath) {
            params.append("contentFilePath", form.contentFilePath); //* [251013] 💾 첨부파일 로직 추가
        }

        // ⚠️ axiosCms의 기본 Content-Type(application/json) 무시하도록 설정
        const config = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded", // axios 기본값인 JSON 전송 대신, URL 인코딩 방식으로 지정

            },
        };

        try {
            if (isEditMode) { // 수정 모드일 경우 (URL에 contentId 존재)
                await api.put(`/api/cms/contents/${contentId}`, params, config); // PUT 요청으로 수정
                alert("콘텐츠가 수정되었습니다."); // 사용자에게 성공 알림
            } else { // 신규 등록 모드일 경우
                await api.post(`/api/cms/contents`, params, config); // POST 요청으로 신규 등록
                alert("콘텐츠가 등록되었습니다."); // 사용자에게 성공 알림
            }
            navigate("/cms/contents"); // 작업 완료 후 목록 화면으로 이동
        } catch (err: any) { // 에러를 콘솔에 출력, catch (err)로 하면 일부 속성은 차단됨, catch (err: any) any를 붙이면 어느 속성도 허용됨
            console.error("저장 실패:", err);
            console.log("저장 실패 원인 로그:", err.response?.data); // 서버 응답 상태 코드 확인

            const status = err?.response?.status;
            const msg =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "저장 중 오류가 발생했습니다.";

            if (status === 409) {
                alert(`⚠️ ${msg}\n(정렬번호가 중복됩니다. 다른 번호를 사용하세요.)`);
            } else if (status === 403) {
                alert("⚠️ 권한이 없습니다. CMS 로그인 정보를 확인하세요.");
            } else {
                alert(msg);
            }
        }
    };


    // [5] 하단 버튼 (등록/수정, 취소)
    const handleCancel = () => navigate("/cms/contents"); // 목록으로 복귀

    // [6] 렌더링 (Tailwind 폼 구성)
    return (
        console.log("JSX 렌더링 시작"),
        <div className="p-8 bg-white rounded shadow-md">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">
                {isEditMode ? "콘텐츠 수정" : "콘텐츠 등록"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* [6-1] 콘텐츠 구분 */}
                <div>
                    <label className="block font-semibold mb-1">콘텐츠 구분</label>
                    <select
                        name="contentType"
                        value={form.contentType}
                        onChange={handleChange}
                        className="border rounded w-full p-2"
                    >
                        <option value="이용안내">이용안내</option>
                        <option value="상품/시설안내">상품/시설안내</option>
                    </select>
                </div>

                {/* [6-2] 제목 */}
                <div>
                    <label className="block font-semibold mb-1">콘텐츠 제목</label>
                    <input
                        type="text"
                        name="contentTitle"
                        value={form.contentTitle}
                        onChange={handleChange}
                        className="border rounded w-full p-2"
                        required
                    />
                </div>

                {/* [6-3] 내용 */}
                <div>
                    <label className="block font-semibold mb-1">콘텐츠 내용</label>
                    {/* 단순 텍스트 */}
                    {/* 
                        <textarea
                        name="contentContent"
                        value={form.contentContent}
                        onChange={handleChange}
                        className="border rounded w-full p-2 h-40"
                        required
                    ></textarea>  
                    */}
                    {/* //^ 📝------------------------- [리치에디터] react-draft-wysiwyg 적용 영역  ----------------------------*/}
                    {/* ✅ [251014] 공용 리치에디터 컴포넌트로 대체 */}
                    <Editor
                        onChange={handleEditorChange}           // HTML 본문이 바뀔 때 실행되는 콜백
                        defaultValue={form.contentContent}      // 수정 모드일 경우 기존 내용 표시
                    />
                    {/* //^ 📝------------------------- [리치에디터] react-draft-wysiwyg 적용 영역  ----------------------------*/}

                    {/* //* 💾----------------------------- [첨부파일] 첨부파일 업로드 적용 영역  --------------------------------*/}
                    {/* [6-3-1] 첨부파일 업로드 */}
                    <div className="mt-6">
                        <label className="block font-semibold mb-1">첨부파일 업로드</label>

                        <FileUploadInput
                            targetType="content"                          // 업로드 대상 (DB file_tbl.file_target_type)
                            targetId={Number(contentId) || 0}             // 신규(0) or 수정모드(contentId)
                            apiInstance={api}                             // CMS axiosCms 인스턴스
                            onUploadSuccess={(path: string) => {          // 업로드 성공 시 콜백
                                // ⚠️ path가 절대경로가 아니라면 여기서 명시적으로 확인/보정
                                if (path) {
                                    const fullPath =
                                        path.startsWith("/images/") || path.startsWith("http")
                                            ? path
                                            : `/images/content/${path}`; // ✅ 백엔드 저장 구조에 맞게 prefix 추가

                                    console.log("✅ 업로드 완료, 저장 경로:", fullPath);
                                    setForm((prev) => ({ ...prev, contentFilePath: fullPath }));
                                } else {
                                    console.warn("⚠️ 업로드 경로가 비어 있음");
                                }
                            }}
                        />
                        {/* //* 💾----------------------------- [첨부파일] 첨부파일 업로드 적용 영역  --------------------------------*/}

                        {/* 업로드된 파일 경로 미리보기 */}
                        {form.contentFilePath && (
                            <div className="mt-2 text-sm text-gray-600">
                                첨부파일:
                                <a
                                    href={`http://localhost:8181${form.contentFilePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline ml-2"
                                >
                                    {form.contentFilePath.split("/").pop()}
                                </a>
                            </div>
                        )}
                        {/* //* 💾----------------------------- [첨부파일] 첨부파일 업로드 적용 영역  --------------------------------*/}
                    </div>
                </div>

                {/* [6-4] 정렬번호 */}
                <div>
                    <label className="block font-semibold mb-1">콘텐츠번호 (2depth 순서)</label>
                    <input
                        type="number"
                        name="contentNum"
                        value={form.contentNum}
                        onChange={handleChange}
                        className="border rounded w-full p-2"
                        required
                    />
                </div>

                {/* [6-5] 사용여부 */}
                <div>
                    <label className="block font-semibold mb-1">사용여부</label>
                    <select
                        name="contentUse"
                        value={form.contentUse}
                        onChange={handleChange}
                        className="border rounded w-full p-2"
                    >
                        <option value="Y">Y (사용)</option>
                        <option value="N">N (미사용)</option>
                    </select>
                </div>

                {/* [6-6] 버튼 */}
                <div className="flex justify-end gap-3 mt-8">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border rounded hover:bg-gray-100"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {isEditMode ? "수정" : "등록"}
                    </button>
                </div>
            </form>
        </div>
    );
}