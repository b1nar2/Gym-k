package com.gym.controller.user;

import com.gym.common.ApiResponse;
import com.gym.common.PageResponse;
import com.gym.domain.facility.*;
import com.gym.service.FacilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Facility", description = "시설 API (생성/조회/검색/수정/삭제/사용여부)")
@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
@Slf4j
public class UserFacilityController {

    private final FacilityService facilityService;

    @Operation(summary = "시설 생성", description = "facility_tbl INSERT, PK 반환")
    @PostMapping
    public ApiResponse<Long> createFacility(@RequestBody FacilityCreateRequest req) {
        log.info("[POST]/api/facilities req={}", req);
        Long pk = facilityService.createFacility(req);
        return ApiResponse.ok(pk);
    }

    @Operation(summary = "시설 단건 조회", description = "PK로 단건 조회")
    @GetMapping("/{facilityId}")
    public ApiResponse<FacilityResponse> getFacilityById(@PathVariable("facilityId") Long facilityId) {
        log.info("[GET]/api/facilities/{}", facilityId);
        return ApiResponse.ok(facilityService.getFacilityById(facilityId));
    }

    @Operation(summary = "시설 목록/검색", description = "name/facilityUse + 페이징(page,size) + 정렬(sort)")
    @GetMapping
    public ApiResponse<PageResponse<FacilityResponse>> searchFacilities(
            @Parameter(description = "시설명 검색어") @RequestParam(required = false) String name,
            @Parameter(description = "사용 여부 (true=Y, false=N)") @RequestParam(required = false) Boolean facilityUse,
            @Parameter(description = "페이지 번호 (0부터 시작)") @RequestParam(required = false) Integer page,
            @Parameter(description = "페이지 크기") @RequestParam(required = false) Integer size,
            @Parameter(description = "정렬 (예: name,asc / name,desc / regdate,asc / regdate,desc)") @RequestParam(required = false) String sort
    ) {
        log.info("[GET]/api/facilities?name={}&use={}&page={}&size={}&sort={}", name, facilityUse, page, size, sort);
        return ApiResponse.ok(facilityService.searchFacilities(name, facilityUse, page, size, sort));
    }

    @Operation(summary = "시설 수정", description = "null 필드 미변경, reg/mod 자동 처리")
    @PutMapping("/{facilityId}")
    public ApiResponse<Void> updateFacility(@PathVariable("facilityId") Long facilityId,
                                            @RequestBody FacilityUpdateRequest req) {
        log.info("[PUT]/api/facilities/{} req={}", facilityId, req);
        facilityService.updateFacility(facilityId, req);
        return ApiResponse.ok();
    }

    @Operation(summary = "시설 삭제", description = "PK로 삭제")
    @DeleteMapping("/{facilityId}")
    public ApiResponse<Void> deleteFacilityById(@PathVariable("facilityId") Long facilityId) {
        log.info("[DELETE]/api/facilities/{}", facilityId);
        facilityService.deleteFacilityById(facilityId);
        return ApiResponse.ok();
    }

    @Operation(summary = "시설 사용여부 변경", description = "Y/N 토글")
    @PatchMapping("/{facilityId}/use")
    public ApiResponse<Void> changeFacilityUse(@PathVariable("facilityId") Long facilityId,
                                               @RequestParam(name = "facilityUse") boolean facilityUse) {
        log.info("[PATCH]/api/facilities/{}/use?facilityUse={}", facilityId, facilityUse);
        facilityService.changeFacilityUse(facilityId, facilityUse);
        return ApiResponse.ok();
    }
}
