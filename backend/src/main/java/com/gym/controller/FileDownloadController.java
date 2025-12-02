package com.gym.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.net.URLEncoder;
import java.nio.file.Files;

/**
 * 파일 다운로드 & 미리보기 전용 컨트롤러
 * - 일반 첨부파일과 리치에디터 이미지를 한 클래스에서 처리
 * - URL 예시:
 *   1) /images/{category}/{fileName}
 *   2) /images/{category}/editor/{fileName}
 */

@RestController //[251019] 단순 뷰 반환 + 첨부파일 다운로드 @Controller → @RestController 
@CrossOrigin("*")
@RequestMapping("/images")
@Log4j2
public class FileDownloadController {

    // [251010] application.yml의 절대경로 주입
    @Value("${fileUploadPath}")
    private String uploadBaseDir; // 예: C:/developer_project/gym_reservation_files/

    // ============================================================
    // [1] 일반 첨부파일 다운로드
    // ============================================================
    @CrossOrigin("*")
    @GetMapping("/{category}/{fileName:.+}")
    public ResponseEntity<?> downloadOrPreviewFile(
            @PathVariable("category") String category,
            @PathVariable("fileName") String fileName,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        log.info("파일 다운로드 조회: {}", fileName);
        log.info("경로 카테고리 조회: {}", category);
        log.info("파일 다운로드 경로조회: {}", uploadBaseDir);

        try {
            // [1] 절대경로 조합
            //String fullPath = uploadBaseDir + "images/" + category + "/" + fileName;
            String fullPath = uploadBaseDir + category + "/" + fileName; // [251019] "images/" 제거, uploadBaseDir 안에 이미 "images/" 포함돼 있음..images/images/..이렇게 중복되버림
            log.info("[FileDownloadController] 파일경로: {}", fullPath);

            File file = new File(fullPath);
            if (!file.exists()) {
                log.warn("[FileDownloadController] 파일 없음: {}", fullPath);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("파일을 찾을 수 없습니다: " + fileName);
            }

            // [2] MIME 타입 자동 감지
            String mimeType = Files.probeContentType(file.toPath());
            if (mimeType == null) mimeType = "application/octet-stream";
            log.info("[FileDownloadController] 타입 감지됨: {}", mimeType);

            // [3] 브라우저별 인코딩 처리
            String userAgent = request.getHeader("User-Agent");
            String encodedName;
            if (userAgent != null && userAgent.contains("MSIE")) {
                encodedName = URLEncoder.encode(fileName, "UTF-8").replaceAll("\\+", "%20");
            } else if (userAgent != null && userAgent.contains("Trident")) {
                encodedName = URLEncoder.encode(fileName, "UTF-8").replaceAll("\\+", "%20");
            } else {
                encodedName = new String(fileName.getBytes("UTF-8"), "ISO-8859-1");
            }

            /*
            // [4] 헤더 구성 (구버전 — MIME 중복 발생)
            HttpHeaders headers = new HttpHeaders();
            if (mimeType.startsWith("image/") || mimeType.startsWith("text/") || mimeType.contains("pdf")) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encodedName + "\"");
            } else {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedName + "\"");
            }

            headers.add(HttpHeaders.CONTENT_TYPE, mimeType);
            headers.add(HttpHeaders.CONTENT_LENGTH, String.valueOf(file.length()));

            // [5] 파일 스트림 반환 (기존방식)
            InputStreamResource resource = new InputStreamResource(new FileInputStream(file));
            log.info("[FileDownloadController] 다운로드/미리보기 응답 성공: {}", fullPath);
            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
            */

            // [251019] 변경사유: MIME 헤더 중복 제거 및 ResponseEntity 빌더 방식 통합
            InputStreamResource resource = new InputStreamResource(new FileInputStream(file));
            log.info("[251019] [FileDownloadController] 다운로드/미리보기 응답 성공: {}", fullPath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType)) // ✅ Content-Type 자동 처리
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            (mimeType.startsWith("image/") || mimeType.contains("pdf"))
                                    ? "inline; filename=\"" + encodedName + "\""
                                    : "attachment; filename=\"" + encodedName + "\"")
                    .contentLength(file.length()) // ✅ 파일 크기 지정
                    .body(resource);

        } catch (Exception e) {
            log.error("[FileDownloadController] 다운로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("파일 처리 중 오류가 발생했습니다.");
        }
    }

    // ============================================================
    // [2] 리치에디터용 다운로드
    // ============================================================
    @CrossOrigin("*")
    @GetMapping("/{category}/editor/{fileName:.+}")
    public ResponseEntity<?> downloadOrPreviewEditorFile(
            @PathVariable("category") String category,
            @PathVariable("fileName") String fileName,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        log.info("[리치에디터] 파일 다운로드 조회: {}", fileName);
        log.info("[리치에디터] 카테고리 조회: {}", category);
        log.info("[리치에디터] 파일 다운로드 경로조회: {}", uploadBaseDir);

        try {
            // [1] 절대경로 조합
            //String fullPath = uploadBaseDir + "images/" + category + "/editor/" + fileName;
            String fullPath = uploadBaseDir + category + "/editor/" + fileName; // [251019] "images/" 제거
            log.info("[EditorFileDownload] 파일경로: {}", fullPath);

            File file = new File(fullPath);
            if (!file.exists()) {
                log.warn("[EditorFileDownload] 파일 없음: {}", fullPath);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("파일을 찾을 수 없습니다: " + fileName);
            }

            // [2] MIME 타입 감지
            String mimeType = Files.probeContentType(file.toPath());
            if (mimeType == null) mimeType = "application/octet-stream";
            log.info("[EditorFileDownload] MIME 타입 감지됨: {}", mimeType);

            // [3] 브라우저별 파일명 인코딩 처리
            String userAgent = request.getHeader("User-Agent");
            String encodedName;
            if (userAgent != null && userAgent.contains("MSIE")) {
                encodedName = URLEncoder.encode(fileName, "UTF-8").replaceAll("\\+", "%20");
            } else if (userAgent != null && userAgent.contains("Trident")) {
                encodedName = URLEncoder.encode(fileName, "UTF-8").replaceAll("\\+", "%20");
            } else {
                encodedName = new String(fileName.getBytes("UTF-8"), "ISO-8859-1");
            }

            /*
            // [4] 헤더 구성 (구버전 — MIME 중복 발생)
            HttpHeaders headers = new HttpHeaders();
            if (mimeType.startsWith("image/") || mimeType.startsWith("text/") || mimeType.contains("pdf")) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encodedName + "\"");
            } else {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedName + "\"");
            }
            
            headers.add(HttpHeaders.CONTENT_TYPE, mimeType);
            headers.add(HttpHeaders.CONTENT_LENGTH, String.valueOf(file.length()));

            // [5] 파일 스트림 반환 (기존 방식)
            InputStreamResource resource = new InputStreamResource(new FileInputStream(file));
            log.info("[EditorFileDownload] 다운로드/미리보기 응답 성공: {}", fullPath);
            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
            */

            // [251019] 변경사유: ResponseEntity 빌더 방식으로 MIME 자동 처리 및 중복 제거
            InputStreamResource resource = new InputStreamResource(new FileInputStream(file));
            log.info("[251019] [EditorFileDownload] 다운로드/미리보기 응답 성공: {}", fullPath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType)) // ✅ Content-Type 자동 설정
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            (mimeType.startsWith("image/") || mimeType.contains("pdf"))
                                    ? "inline; filename=\"" + encodedName + "\""
                                    : "attachment; filename=\"" + encodedName + "\"")
                    .contentLength(file.length()) // ✅ 파일 크기 지정
                    .body(resource);

        } catch (Exception e) {
            log.error("[EditorFileDownload] 다운로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("파일 다운로드 중 오류가 발생했습니다.");
        }
    }
}
