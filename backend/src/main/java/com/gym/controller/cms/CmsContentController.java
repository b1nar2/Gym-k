
package com.gym.controller.cms;

import com.gym.common.ApiResponse;
import com.gym.domain.content.ContentCreateRequest;
import com.gym.domain.content.ContentResponse;
import com.gym.domain.content.ContentSearchRequest;
import com.gym.domain.content.ContentUpdateRequest;
import com.gym.domain.file.FileResponse;
import com.gym.security.dto.SecuRoleDTO;
import com.gym.security.dto.SecuUserDTO;
import com.gym.service.ContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // [251013] 첨부파일 기능

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.gym.mapper.annotation.FileMapper; // 💾 추가
@RestController
@RequestMapping("/api/cms/contents")
@RequiredArgsConstructor
@Tag(name = "04.Contents-CMS", description = "CMS 콘텐츠 관리(목록/등록/수정/삭제)")
@Log4j2
public class CmsContentController {

	private final ContentService contentService;
	private final FileMapper fileMapper; // 💾 파일 조회용 매퍼 추가
	/**
	 * 콘텐츠 목록 조회(GET) - 입력: memberId(작성자ID), contentTitle(콘텐츠명), page, size - 모두 선택
	 * 입력(미입력 시 전체 조회) - 페이징은 컨트롤러에서 subList로 간단 처리
	 */
	@Operation(summary = "콘텐츠 목록", description = "작성자ID/콘텐츠명/페이지/사이즈로 조회(미입력 시 전체)")
	@GetMapping
	public ApiResponse<Map<String, Object>> listContents(
			@RequestParam(value = "memberId", required = false) String memberId,
			@RequestParam(value = "contentTitle", required = false) String contentTitle,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size) {
		if (page < 0)
			page = 0;
		if (size <= 0)
			size = 10;

		// 컨트롤러에서 DTO 생성 → 서비스 시그니처 준수
		ContentSearchRequest req = new ContentSearchRequest();
		req.setMemberId(memberId);
		req.setContentTitle(contentTitle);

		// 서비스 호출(시그니처 그대로)
		List<ContentResponse> all = contentService.listContents(req);

		// 간단 페이징
		int total = all.size();
		int from = Math.min(page * size, total);
		int to = Math.min(from + size, total);
		List<ContentResponse> items = all.subList(from, to);

		// 응답 payload
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("items", items); // 콘텐츠 목록
		payload.put("total", total); // 총 개수
		payload.put("page", page);	 // 페이지
		payload.put("size", size);	 // 페이지 크기
		payload.put("hasNext", to < total);

		return ApiResponse.ok(payload);
	}

	/**
	 * 콘텐츠 등록 (POST) - 입력: 콘텐츠 제목, 내용, 번호 - 콘텐츠 구분은 이용안내와 상품/시설안내 중 선택 -
	 * memberId(작성자ID)는 자동으로 로그인한 계정 ID로 등록
	 */
	@Operation(summary = "콘텐츠 등록", description = "텍스트박스 입력 폼으로 등록(작성자ID는 로그인ID로 고정)")
	@PostMapping(consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
	public ResponseEntity<ApiResponse<Long>> createContent(
			// 주의사항!! @RequestParam에서 defaultValue를 쓰면 필수입력사항(*)+빨간색 텍스트 적용이 안됨, 그 점 고려해야 함

			@Parameter(name = "contentTitle", description = "콘텐츠 제목", required = true, 
					   schema = @Schema(type = "string", example = "제목"))
					   @RequestParam(value = "contentTitle", required = true) String contentTitle,
					   
			@Parameter(name = "contentContent", description = "콘텐츠 내용", required = true,
					   schema = @Schema(type = "string", example = "내용"))
					   @RequestParam(value = "contentContent", required = true) String contentContent,

			@Parameter(name = "contentType", description = "콘텐츠 구분(이용안내 / 상품/시설안내)",
					   schema = @Schema(type = "string", allowableValues = {"이용안내", "상품/시설안내" }, example = "이용안내"))
					   @RequestParam("contentType") String contentType,

			@Parameter(name = "contentUse", description = "사용여부(Y/N)", 
					   schema = @Schema(type = "string", allowableValues = {"Y", "N" }, example = "Y"))
					   @RequestParam("contentUse") String contentUse,

			@Parameter(name = "contentNum", description = "콘텐츠번호(중복 불가, 2자리)", required = true,
					   schema = @Schema(type = "string", example = "00"))
					   @RequestParam(value = "contentNum", required = true) Integer contentNum,
					   
		    // ⚠️ [251013 추가] 첨부파일 입력
	        @Parameter(name = "file", description = "첨부파일(선택)", required = false)
	        @RequestPart(value = "file", required = false) MultipartFile file,

			Authentication auth) {
		
		// TODO----------------- 로그인 및 권한 로그 검토 -----------------
		// TODO SecurityContextHolder.getContext()=SecurityContext를 기점으로
		// TODO 토큰으로 인증된 정보를 가져옴
		Authentication auths = SecurityContextHolder.getContext().getAuthentication();

		// TODO 로그인한 사용자 정보
		Object principal = auths.getPrincipal();
		log.info("/api/cms/contents/ post:{}", principal); // 해당 컨트롤럴의 @RequestMapping에 있는 경로 붙어넣기

		// TODO 로그인 여부
		boolean loginYN = auths.isAuthenticated();
		log.info("/api/cms/contents/ post loninY/N:{}", loginYN); // 해당 컨트롤럴의 @RequestMapping에 있는 경로 붙어넣기

		// TODO 권한(ROLE) 정보 가져오기 (admin인지, user인지)
		SecuUserDTO secuUserDTO = (SecuUserDTO) principal;
		Collection<SecuRoleDTO> coll = (Collection<SecuRoleDTO>) secuUserDTO.getAuthorities();
		log.info("role:" + ((SecuRoleDTO) coll.toArray()[0]).getAuthority());
		
		ResponseEntity<ApiResponse<Long>> responseEntity = null;

		if (auth == null || auth.getName() == null)
			throw new AccessDeniedException("로그인이 필요합니다.");
		String loginId = auth.getName(); // 작성자ID = 로그인ID

		ContentCreateRequest req = new ContentCreateRequest();
		req.setContentTitle(contentTitle);
		req.setContentContent(contentContent);
		req.setMemberId(loginId);
		req.setContentType(contentType);
		req.setContentUse(contentUse);
		req.setContentNum(contentNum);

		try {
			//Long pk = contentService.createContent(req);
			Long pk = contentService.createContent(req, file); // [251013] 첨부파일 포함 등록
			// return ApiResponse.ok(pk);
			responseEntity = new ResponseEntity<>(ApiResponse.ok(pk), HttpStatus.OK);
		// ------------------------------------ [251013] 첨부파일 업로도 로그 기록 ------------------------------------	
		} catch (IOException e) { // ⚠️ IOException 처리 추가
		    log.error("파일 저장 중 오류 발생: {}", e.getMessage());
		    responseEntity = new ResponseEntity<>(ApiResponse.fail(-500, "파일 저장 중 오류가 발생했습니다."), HttpStatus.INTERNAL_SERVER_ERROR);
		// ------------------------------------ [251013] 첨부파일 업로도 로그 기록 ------------------------------------
		} catch (RuntimeException ex) {
			// ------------------------------------ [251012] 정렬 번호 중복 체크 ------------------------------------
			Throwable cause = ex.getCause();
			// 1) 스프링 매핑 예외로 들어온 경우
			// 가독성 + 테스트를 위해서 ResponseEntity 기준으로 변경함
			if (cause instanceof DuplicateKeyException || cause instanceof DataIntegrityViolationException) {
				
				// serviceImpl의 콘텐츠 정렬번호 중복 기능과 연동
				
				// responseEntity = new ResponseEntity<>(ApiResponse.fail(-1, "콘텐츠번호가 중복됩니다."),HttpStatus.CONFLICT);
				String msg = ex.getMessage(); // ServiceImpl에서의 메시지 정보를 msg 변수에 저장
				responseEntity = new ResponseEntity<>(ApiResponse.fail(-1, msg), HttpStatus.CONFLICT);
				
				// throw new ResponseStatusException(HttpStatus.CONFLICT, "콘텐츠번호가 중복됩니다.", ex);				
				// throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage(), ex); // CmsContentDetail.tsx와 중복됨으로 주석처리
			}
			// 2) 드라이버가 원문만 던지는 경우(ORA-00001 또는 제약명 매칭)
			// 가독성 + 테스트를 위해서 ResponseEntity 기준으로 변경함
			String msg = ex.getMessage();
			log.info("errror msg:" + msg);
			if (msg != null && (msg.contains("ORA-00001") || msg.contains("CONTENTS_TBL_NUM_UN"))) {
				responseEntity = new ResponseEntity<>(ApiResponse.fail(-1, "콘텐츠번호가 중복됩니다."), HttpStatus.OK);
			}
			// ------------------------------------ [251012] 정렬 번호 중복 체크 ------------------------------------
		}
		return responseEntity;
	}


	/** 수정(PUT, application/x-www-form-urlencoded) */
	@Operation(summary = "콘텐츠 수정", description = "수정할 콘텐츠 번호 입력 후, 텍스트박스 입력 폼으로 수정(작성자ID는 로그인ID로 고정)")
	@PutMapping(value = "/{contentId}", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
	public ResponseEntity<ApiResponse<Integer>> updateContent(@PathVariable("contentId") Long contentId,

	        @Parameter(name = "contentTitle", description = "콘텐츠 제목(미입력 시 기존값 유지)", required = false,
	        	       schema = @Schema(type = "string", example = "제목"))
	        	       @RequestParam(value = "contentTitle", required = false) String contentTitle,

	        @Parameter(name = "contentContent", description = "콘텐츠 내용(미입력 시 기존값 유지)", required = false,
	        		   schema = @Schema(type = "string", example = "내용"))
	       			   @RequestParam(name = "contentContent", required = false) String contentContent,

	        @Parameter(name = "contentType", description = "콘텐츠 구분(이용안내 / 상품/시설안내)",
			   		   schema = @Schema(type = "string", allowableValues = {"이용안내", "상품/시설안내" }, example = "이용안내"))
			   		   @RequestParam(name = "contentType", required = false) String contentType,

			@Parameter(name = "contentUse", description = "사용여부(Y/N)", 
			   		   schema = @Schema(type = "string", allowableValues = {"Y", "N" }, example = "Y"))
			   		   @RequestParam(name = "contentUse", required = false) String contentUse,

	        @Parameter(name = "contentNum", description = "콘텐츠번호(중복 불가, 미입력 시 기존값 유지)", required = false,
	        		   schema = @Schema(type = "string", example = "00"))
	        		   @RequestParam(name = "contentNum", required = false) Integer contentNum,
	        
	        		// ⚠️ [251013 추가] 첨부파일 입력
	       	        @Parameter(name = "file", description = "첨부파일(선택)", required = false)
	       	        @RequestPart(value = "file", required = false) MultipartFile file,


	        Authentication auth) {

	    // ---------- 로그인 및 권한 로그(등록과 동일 포맷) ----------
	    var auths = SecurityContextHolder.getContext().getAuthentication();
	    Object principal = auths != null ? auths.getPrincipal() : null;
	    log.info("/api/cms/contents/ put:{}", principal);
	    boolean loginYN = auths != null && auths.isAuthenticated();
	    log.info("/api/cms/contents/ put loninY/N:{}", loginYN);
	    if (principal instanceof com.gym.security.dto.SecuUserDTO s) {
	        var coll = (java.util.Collection<com.gym.security.dto.SecuRoleDTO>) s.getAuthorities();
	        if (!coll.isEmpty()) {
	            log.info("role:" + ((com.gym.security.dto.SecuRoleDTO) coll.toArray()[0]).getAuthority());
	        }
	    }
	    // -------------------------------------------------------

	    if (auth == null || auth.getName() == null) {
	        throw new AccessDeniedException("로그인이 필요합니다.");
	    }
	    String loginId = auth.getName(); // 작성자ID는 로그인ID로 고정

	    // 1) 기존 데이터 조회 (NULL로 들어온 항목은 기존값 유지하기 위함)
	    var curr = contentService.getContentById(contentId);
	    if (curr == null) {
	        // UI 일관성 위해 200으로 내려도 되고, 필요하면 NOT_FOUND로 바꿔도 됨
	        return ResponseEntity.ok(ApiResponse.fail(-404, "콘텐츠가 존재하지 않습니다."));
	    }

	    // 2) 업데이트 요청 DTO 구성 (NULL 또는 빈 문자열 -> 기존값 대입)
	    ContentUpdateRequest req = new ContentUpdateRequest();
	    req.setContentId(contentId);
	    req.setMemberId(loginId); // 트리거가 UPDATE 시 작성자 권한 검사하므로 로그인ID로 고정

	    req.setContentTitle(orKeep(contentTitle, curr.getContentTitle()));
	    req.setContentContent(orKeep(contentContent, curr.getContentContent()));
	    req.setContentType(orKeep(contentType, curr.getContentType()));
	    req.setContentUse(orKeep(contentUse, curr.getContentUse()));
	    req.setContentNum((contentNum != null) ? contentNum : curr.getContentNum());

	    try {
	        int affected = contentService.updateContent(req);
	        return ResponseEntity.ok(ApiResponse.ok(affected));
	    } catch (RuntimeException ex) {
	    	
	    	// -------------------------------- [251012] 수정 화면 정렬 번호 중복 체크 ---------------------------------
	        
	        Throwable cause = ex.getCause();
	        // ✅ [251012] 중복 예외 상세 메시지 연동
	        if (cause instanceof DuplicateKeyException || cause instanceof DataIntegrityViolationException) {
	            String msg = ex.getMessage(); // ServiceImpl에서 만들어준 메시지
	            // ⚠️ 기존: 200 OK → 잘못된 성공 표시됨
	            // ✅ 수정: 409 Conflict → 프론트 catch로 전달
	            return new ResponseEntity<>(ApiResponse.fail(-1, msg != null ? msg : "콘텐츠번호가 중복됩니다."), HttpStatus.CONFLICT);
	        }

	        // ⚠️ DB 제약명 기반 예외 (기존 처리)
	        String msg = ex.getMessage();
	        log.info("update error msg: {}", msg);
	        if (msg != null && (msg.contains("ORA-00001") || msg.contains("CONTENTS_TBL_NUM_UN"))) {
	            return new ResponseEntity<>(ApiResponse.fail(-1, "콘텐츠번호가 중복됩니다."), HttpStatus.CONFLICT);
	        }

	        // ⚠️ 기타 예외
	        return new ResponseEntity<>(ApiResponse.fail(-500, "서버 오류가 발생했습니다."), HttpStatus.INTERNAL_SERVER_ERROR);
	        
	        // -------------------------------- [251012] 수정 화면 정렬 번호 중복 체크 ---------------------------------
	    }
	}

	// CmsContentController 내부에 유틸 추가
	private static String orKeep(String incoming, String current) {
	    return (incoming == null || incoming.trim().isEmpty()) ? current : incoming;
	}


	/** 삭제(DELETE) */
	@Operation(summary = "콘텐츠 삭제", description = "PK로 삭제")
	@DeleteMapping("/{contentId}")
	public ApiResponse<Integer> deleteContent(@PathVariable("contentId") Long contentId) {
		return ApiResponse.ok(contentService.deleteContentById(contentId));
	}
	
	/** [251011] 콘텐츠 단건 조회 (상세 + 첨부파일 포함)
	 *  - GET /api/cms/contents/{contentId}
	 *  - 프론트: CmsContentDetail.tsx
	 */
	@Operation(summary = "콘텐츠 단건 조회", description = "콘텐츠 ID로 상세정보 + 첨부파일 조회")
	@GetMapping("/{contentId}")
	public ApiResponse<Map<String, Object>> getContentByIdWithFiles(
	        @PathVariable("contentId") Long contentId) {

	    log.info("/api/cms/contents/{} 단건조회 호출", contentId);

	    // [1] 콘텐츠 기본정보 조회
	    ContentResponse content = contentService.getContentById(contentId);
	    if (content == null) {
	        return ApiResponse.fail(-404, "해당 콘텐츠를 찾을 수 없습니다.");
	    }

	    // [2] 첨부파일 조회 (file_target_type='content', file_target_id=contentId)
	    List<FileResponse> files = fileMapper.listFilesByTarget("content", String.valueOf(contentId));

	    // [3] 응답 구성
	    Map<String, Object> payload = new LinkedHashMap<>();
	    payload.put("content", content);
	    payload.put("files", files);

	    log.info("상세조회 완료: contentId={}, 첨부파일 {}개", contentId, files.size());
	    return ApiResponse.ok(payload);
	}

}
