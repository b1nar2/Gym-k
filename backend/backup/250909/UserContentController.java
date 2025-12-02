package com.gym.controller.user;

import com.gym.common.ApiResponse;            // 표준 응답 Wrapper (직접 만들어둔 클래스)
import com.gym.domain.content.*;
import com.gym.service.ContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 콘텐츠 컨트롤러 (Swagger 엔드포인트)
 * - 등록/조회/수정/삭제 (CRUD)
 * - 등록 시 방금 생성된 PK(contentId)를 반환
 */
@Tag(name = "콘텐츠 API", description = "콘텐츠 CRUD API")
@RestController
@RequestMapping("/api/contents")
@RequiredArgsConstructor
public class UserContentController {

    private final ContentService contentService;

    /**
     * 1. 콘텐츠 등록 (방금 생성된 PK 반환)
     */
    @Operation(summary = "콘텐츠 등록", description = "새로운 콘텐츠를 등록하고 PK를 반환합니다.")
    @PostMapping
    public ApiResponse<Long> createContent(@RequestBody ContentCreateRequest request) {
        Long pk = contentService.createContent(request);
        return ApiResponse.ok(pk);  // { code:0, message:"success", data:<PK> }
    }
    
    /*
		{
		  "contentTitle": "이용 안내",
		  "contentContent": "<h2>이용 안내</h2><p>운영시간 08:00~22:00<br>예약 필수</p>",
		  "memberId": "hong10",
		  "contentUse": "Y",
		  "contentNum": 20,
		  "contentType": "상품/시설안내"
		}
     */
    

    /**
     * 2. 콘텐츠 단건 조회
     */
    @Operation(summary = "콘텐츠 단건 조회", description = "콘텐츠 ID로 조회합니다.")
    @GetMapping("/{contentId}")
    public ApiResponse<ContentResponse> getContentById(@PathVariable Long contentId) {
        ContentResponse res = contentService.getContentById(contentId);
        return ApiResponse.ok(res);
    }

    /**
     * 3. 콘텐츠 목록 조회
     */
    @Operation(summary = "콘텐츠 목록", description = "조건에 맞는 콘텐츠 목록을 조회합니다.")
    @GetMapping
    public ApiResponse<List<ContentResponse>> listContents(ContentSearchRequest request) {
        return ApiResponse.ok(contentService.listContents(request));
    }

    /**
     * 4. 콘텐츠 수정
     */
    @Operation(summary = "콘텐츠 수정", description = "기존 콘텐츠를 수정합니다.")
    @PutMapping("/{contentId}")
    public ApiResponse<Integer> updateContent(@PathVariable Long contentId,
                                              @RequestBody ContentUpdateRequest request) {
        request.setContentId(contentId); // PathVariable → DTO 반영
        return ApiResponse.ok(contentService.updateContent(request));
    }

    /**
     * 5. 콘텐츠 삭제
     */
    @Operation(summary = "콘텐츠 삭제", description = "콘텐츠 ID로 삭제합니다.")
    @DeleteMapping("/{contentId}")
    public ApiResponse<Integer> deleteContentById(@PathVariable Long contentId) {
        return ApiResponse.ok(contentService.deleteContentById(contentId));
    }
}
