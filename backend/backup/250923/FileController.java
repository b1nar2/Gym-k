package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.domain.file.FileRequest;
import com.gym.domain.file.FileResponse;
import com.gym.domain.file.FileUploadRequest;
import com.gym.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import com.gym.mapper.xml.FileQueryMapper;   // ✅ XML 매퍼 (조회용) 주입 대상
import java.util.List;

@Tag(name = "07.File", description = "첨부파일 API (업로드/조회/삭제)")
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;          // ✅ 기존 서비스 주입(업로드/삭제)
    private final FileQueryMapper fileQueryMapper;  // ✅ [추가] XML 매퍼 주입(조회)

    // ✅ [변경] 생성자에 FileQueryMapper 주입 추가(정적 호출 오류 방지)
    public FileController(FileService fileService, FileQueryMapper fileQueryMapper) {
        this.fileService = fileService;
        this.fileQueryMapper = fileQueryMapper;
    }

    /**
     * 1. 파일 업로드
     */
    @Operation(summary = "파일 업로드", description = "새로운 파일을 업로드합니다.")
    @PostMapping
    public int uploadFile(@RequestBody FileUploadRequest request) {
        return fileService.uploadFile(request);
    }

    /* 
    {
      "fileTargetType": "content",
      "fileTargetId": "1001",
      "fileName": "002.jpg",
      "filePath": "D:/developer_project/gym_reservation/backend/file/images/002.jpg",
      "fileType": "본문",
      "fileExt": "jpg",
      "fileSize": 53248
    }
    */

    /**
     * 2. 파일 목록 조회
     */
    @Operation(summary = "파일 목록", description = "파일 ID, 파일명, 파일종류로 검색합니다.")
    @GetMapping
    public ApiResponse<List<FileResponse>> listFiles(

            @Parameter(description = "파일 ID")
            @RequestParam(name = "fileId", required = false) Long fileId,
            
            @Parameter(description = "파일명(부분일치)")
            @RequestParam(name = "fileName", required = false) String fileName,

            @Parameter(description = "파일 종류(content/board/facility 등)")
            @RequestParam(name = "fileTargetType", required = false) String fileTargetType
    ) {
        // DTO 변환 (Service/Mapper는 그대로 사용)
        FileRequest req = new FileRequest();
        req.setFileId(fileId);
        req.setFileName(fileName);
        req.setFileTargetType(fileTargetType);

        return ApiResponse.ok(fileService.listFiles(req));
    }


    /**
     * 3. 파일 삭제
     */
    @Operation(summary = "파일 삭제", description = "파일 ID로 파일을 삭제합니다.")
    @DeleteMapping("/{fileId}")
    public ApiResponse<Integer> deleteFileById(
            // public int deleteFile(@PathVariable("fileId") Long fileId) {
            @PathVariable("fileId") Long fileId) {
        return ApiResponse.ok(fileService.deleteFileById(fileId));
    }
}
