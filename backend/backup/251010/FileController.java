package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.domain.file.*;
import com.gym.service.FileService;
import com.gym.mapper.xml.FileQueryMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.InputStreamResource;

import java.io.*;
import java.nio.file.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.beans.factory.annotation.Value;

@CrossOrigin("*")
@Tag(name = "07.File", description = "첨부파일 API (업로드/조회/삭제/미리보기/다운로드)")
@RestController
@RequestMapping("/api/files")
@Log4j2
public class FileController {

    private final FileService fileService;
    private final FileQueryMapper fileQueryMapper;

    @Value("${file.upload-dir:}")
    private String configuredUploadRoot;

    public FileController(FileService fileService, FileQueryMapper fileQueryMapper) {
        this.fileService = fileService;
        this.fileQueryMapper = fileQueryMapper;
    }

    // ---------------------------------------------------------------------
    // 0) 멀티파트 업로드 — 기존 임시폴더 저장 로직을 주석처리하고
    //    [251009] 워크스페이스 상대경로 저장 방식으로 교체
    // ---------------------------------------------------------------------
    @CrossOrigin("*")
    @Operation(summary = "파일 업로드(Multipart)", description = "파일 선택으로 업로드. PK는 시퀀스 자동 증가.")
    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<Map<String, Object>> uploadFileMultipart(
            @RequestParam("file") MultipartFile file,
            @RequestParam("fileTargetType") String fileTargetType,
            @RequestParam("fileTargetId") Long fileTargetId,
            @RequestParam(value = "fileType", required = false) String fileType
    ) throws IOException {

        final String memberId = getLoginMemberId();
        if (memberId == null || memberId.isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("인증 필요: 로그인 후 업로드하세요.");
        }

        final String originalName = file.getOriginalFilename();
        final long size = file.getSize();
        String fileExt = "";
        if (originalName != null && originalName.lastIndexOf('.') > -1) {
            fileExt = originalName.substring(originalName.lastIndexOf('.') + 1);
        }

        if (fileType == null || (!"본문".equals(fileType) && !"썸네일".equals(fileType))) {
            fileType = "본문";
        }

        // ✅ 1) 실제 파일 저장
        String savedRelPath;
        try {
            savedRelPath = fileService.savePhysicalFile(file);
        } catch (Exception e) {
            log.error("[FileController] 파일 저장 실패: {}", e.getMessage());
            throw new IOException("파일 저장 중 오류 발생", e);
        }

        // ✅ 2) DB 기록
        FileUploadRequest req = new FileUploadRequest();
        req.setMemberId(memberId);
        req.setFileTargetType(fileTargetType);
        req.setFileTargetId(fileTargetId);
        req.setFileName(originalName);
        req.setFileType(fileType);
        req.setFileExt(fileExt);
        req.setFileSize(size);
        req.setFilePath(savedRelPath);

        int affected = fileService.uploadFile(req);

        // ✅ 3) 응답 구성 — 실제 웹 접근 경로 반환
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("affected", affected);
        result.put("filePath", savedRelPath);
        result.put("originalName", originalName);
        result.put("fileSize", size);

        log.info("[FileController] 업로드 완료: {}", savedRelPath);
        return ApiResponse.ok(result);
    }

    // ---------------------------------------------------------------------
    // 2) 파일 목록 조회 — 유지
    // ---------------------------------------------------------------------
    @CrossOrigin("*")
    @Operation(summary = "파일 목록", description = "파일 ID/파일명/파일 종류(content/board/facility 등)로 검색합니다.")
    @GetMapping
    public ApiResponse<List<FileResponse>> listFiles(
            @Parameter(description = "파일 ID") @RequestParam(name = "fileId", required = false) Long fileId,
            @Parameter(description = "파일명(부분일치)") @RequestParam(name = "fileName", required = false) String fileName,
            @Parameter(description = "파일 종류(content/board/facility 등)") @RequestParam(name = "fileTargetType", required = false) String fileTargetType
    ) {
        FileRequest req = new FileRequest();
        req.setFileId(fileId);
        req.setFileName(fileName);
        req.setFileTargetType(fileTargetType);
        return ApiResponse.ok(fileService.listFiles(req));
    }

    // ---------------------------------------------------------------------
    // 나머지 미리보기/다운로드/삭제
    // ---------------------------------------------------------------------
    @CrossOrigin("*")
    private String getLoginMemberId() {
        
        // [1] 현재 SecurityContext에서 인증 정보 추출
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // [2] 로그인된 사용자면 그대로 통과
        if (auth != null && auth.isAuthenticated()) {
            return auth.getName();
        }

        try {
            // [3] SecurityContext가 비어 있으면, 요청 헤더 직접 확인
            var request = ((org.springframework.web.context.request.ServletRequestAttributes)
                    org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes()).getRequest();

            // [4] CMS와 일반 사용자 둘 다 X-AUTH-TOKEN 사용 → 그냥 허용 처리
            String token = request.getHeader("X-AUTH-TOKEN");
            if (token != null && !token.isBlank()) {
                log.info("[251010] X-AUTH-TOKEN 감지됨 → 관리자 또는 사용자 업로드 허용");
                return "SYSTEM"; // CMS 또는 USER 공통 식별자
            }

        } catch (Exception e) {
            log.warn("[251010] 요청 헤더 확인 중 오류: {}", e.getMessage());
        }

        // [5] 인증정보 없음 → 차단
        return null;
    }

}
