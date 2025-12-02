package com.gym.controller.user;

import com.gym.common.ApiResponse;
import com.gym.domain.content.ContentResponse;
import com.gym.domain.content.ContentSearchRequest;
import com.gym.service.ContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import java.util.List;	// 251011 추가
import java.util.stream.Collectors; // 251012 추가
import com.gym.domain.file.FileResponse; // [251013] 첨부파일 조회 DTO
import com.gym.mapper.annotation.FileMapper; // [251013] 파일 조회용 매퍼 추가
import java.util.Map; // [251013] Map 응답용
import java.util.LinkedHashMap;// [251013] 순서 유지용

import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/contents")
@RequiredArgsConstructor
@Tag(name = "04.Contents-User", description = "사용자용 콘텐츠 단건 조회")
public class UserContentController {

    private final ContentService contentService;
    private final FileMapper fileMapper; // ⚠️ [251013] 파일 조회용 매퍼 추가

    /** 콘텐츠 단건 조회(permitAll) */
    /*
    @Operation(summary = "콘텐츠 단건 조회", description = "콘텐츠 ID로 조회")
    @GetMapping("/{contentId}")
    public ApiResponse<ContentResponse> getContentById(@PathVariable("contentId") Long contentId) {
        return ApiResponse.ok(contentService.getContentById(contentId));
    }
    */
    
    /** [251011] 콘텐츠 단건 조회 1depth/2depth 구조로 조회가 되도록 설정 
     1depth는 콘텐츠의 상위메뉴{contentType} 중 '이용안내' or '상품/시설안내' 중 하나
     2depth는 콘텐츠의 정렬번호{contentNum}가 나오도록 설정
     */
	@GetMapping("/{contentType}/{contentNum}") 
	// public ApiResponse<ContentResponse> getContentByTypeAndNum(
	public ApiResponse<Map<String, Object>> getContentByTypeAndNum( // ⚠️ 리턴타입 수정
		@PathVariable("contentType") String type,	// 1depth 상위메뉴
		@PathVariable("contentNum") Integer num)	// 2depth 정렬번호(네비에서 조회되는건 해당 번호의 콘텐츠명)
		{
		
		// 1️. 검색도메인의 DTO 불러오기
		ContentSearchRequest contentreq = new ContentSearchRequest(); // 콘텐츠 리퀘스트(contentreq) 변수 선언
		contentreq.setContentType(type);  // 상위메뉴 기준으로 검색 기능 활성화
		
		// 2️. 동일한 상위메뉴의 콘텐츠 목록을 조회
		List<ContentResponse> contentlist // 콘텐츠 목록 변수 선언
			= contentService.listContents(contentreq); // 콘텐츠서비스의 목록조회 기능 불러오기 

		// 3️. 정렬번호 일치하는 데이터만 필터링
		ContentResponse result	// 불러오는 콘텐츠 리스폰스의 조회결과 변수 선언 
			= contentlist.stream() // 2번에서 불러온 콘텐츠 목록을 .stream()을 한다...목록 한줄씩 검사한다는 뜻...이유: 콘텐츠 정렬번호 체크를 위해서
			  .filter(content -> content.getContentNum().equals(num)) // filter(조회목록을 필터링한다), 변수 content로 설정하고 번호를 하나씩 체크 
			  .findFirst()	// 가장 최우선 순위 선정 후 반환한다
			  .orElse(null); // 못찾으면 null값으로 반환한다

		// [251013] ---------------------------------⚠️ 첨부파일 기능 추가 시작 ---------------------------------
		List<FileResponse> files = null; // 첨부파일 목록 변수 선언
		if (result != null) {
			files = fileMapper.listFilesByTarget("content", String.valueOf(result.getContentId()));
			// file_target_type='content', file_target_id=콘텐츠ID 기준으로 파일 목록 조회
		}
		// [251013] ---------------------------------⚠️ 첨부파일 기능 추가 끝 -----------------------------------

		// 4️. 단건 결과 반환 (ApiResponse 표준 구조)
		//return ApiResponse.ok(result);
		
		// 4️. 단건 결과 반환 (ApiResponse 표준 구조) [첨부파일 기능 포함]
		Map<String, Object> payload = new LinkedHashMap<>(); // 콘텐츠+파일 함께 반환하기 위한 Map 생성
		payload.put("content", result); // 콘텐츠 본문
		payload.put("files", files); // 첨부파일 목록

		return ApiResponse.ok(payload);
		
	}
	
	/** [251012] 사용자 메뉴 조회 (1depth 기준)
	 *  - 예: /api/contents?type=이용안내
	 */
	@GetMapping
	public ApiResponse<List<ContentResponse>> getContentsByType(
	        @RequestParam(value = "type", required = false) String type) {

	    // 1️ 검색 조건 DTO 생성
	    ContentSearchRequest req = new ContentSearchRequest();
	    req.setContentType(type);

	    // 2️ 서비스에서 목록 조회
	    List<ContentResponse> list = contentService.listContents(req);

	    // 3️ 사용여부(Y)만 필터링 (사용자 화면 전용)
	    list = list.stream()
	            .filter(c -> "Y".equalsIgnoreCase(c.getContentUse()))
	            .collect(Collectors.toList());

	    // 4️ 정렬번호(content_num) 오름차순 정렬
	    list.sort((a, b) -> a.getContentNum() - b.getContentNum());

	    // 5️ 결과 반환
	    return ApiResponse.ok(list);
	}
	
	
	

}