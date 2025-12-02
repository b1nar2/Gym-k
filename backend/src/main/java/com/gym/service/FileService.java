package com.gym.service;

import com.gym.domain.file.*;
import java.util.List;

import org.springframework.web.multipart.MultipartFile; //[251009] 파일 실제 저장 기능
import java.io.IOException; //[251009] 파일 실제 저장 기능
/**
 * 파일 서비스 인터페이스
 * - Controller에서 호출되는 추상 메서드
 */
public interface FileService {
    
	int uploadFile(FileUploadRequest request);	// 파일 등록
    
    int deleteFileById(Long fileId);	// 파일 삭제
    
    // List<FileResponse> listFilesByTarget(String targetType, String targetId);
    List<FileResponse> listFiles(FileRequest req);	// 목록 조회
    
    // [251009] 파일 실제 저장 기능 추가
    // - Controller가 업로드 시 실제 파일을 물리 저장할 때 사용
    // - 구현체(FileServiceImpl)에서 확장자 분류 및 상대경로 생성
    String savePhysicalFile(MultipartFile multipartFile) throws IOException;
    
    // [251014 추가] 리치에디터 이미지 전용 업로드용 메서드
    String saveEditorImage(org.springframework.web.multipart.MultipartFile image) throws java.io.IOException;
}
