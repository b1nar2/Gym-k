package com.gym.service.impl;

import com.gym.domain.file.*;
import com.gym.mapper.annotation.FileMapper;
import com.gym.mapper.xml.FileQueryMapper;
import com.gym.service.FileService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;              // [251009] UUID: 파일명 중복 방지를 위해 고유 식별자 생성용
import java.io.File;               // [251009] File 클래스: 실제 파일 경로/디렉토리 제어용
import java.util.Arrays;           // [251009] Arrays.asList 사용을 위해 import
import java.util.Locale;           // [251009] 확장자 소문자 변환 시 사용
import org.springframework.beans.factory.annotation.Value; // [251010추가] yml 속성 주입용 import

/**
 * 파일 서비스 구현체
 * - 실제 DB 연동은 Mapper 호출
 */
@Service
// [205923추가]
@Slf4j
public class FileServiceImpl implements FileService {
	
	// 파일 등록/삭제용 매퍼 (어노테이션 기반)
    private final FileMapper fileMapper;
    // 파일 조회용 매퍼 (XML 기반)
    private final FileQueryMapper fileQueryMapper;
    // [251010 추가] application.yml의 fileUploadPath 값을 주입받음
    @Value("${fileUploadPath}")
    private String absoluteUploadRoot; // C:/developer_project/gym_reservation_files/

    // 생성자 주입 (스프링이 FileMapper, FileQueryMapper를 자동으로 넣어줌)
    public FileServiceImpl(FileMapper fileMapper, FileQueryMapper fileQueryMapper) {
        this.fileMapper = fileMapper;
        this.fileQueryMapper = fileQueryMapper;
    }
    
    // 업로드 기능
    // 파라미터: FileUploadRequest (파일명, 경로, 크기 등)
    // 반환값: int (INSERT 성공 시 영향받은 행 수, 보통 1)
    @Override
    public int uploadFile(FileUploadRequest request) {
        return fileMapper.uploadFile(request);
    }

    
    /*
    // 특정 대상별 파일 조회 기능
    // 파라미터: targetType(대상 구분), targetId(대상 ID)
    // 반환값: List<FileResponse> (대상에 속한 파일 목록)
    @Override
    public List<FileResponse> listFilesByTarget(String targetType, String targetId) {
        return fileMapper.listFilesByTarget(targetType, targetId);
    } */
    
    // 삭제 기능
    // 파라미터: fileId (삭제할 파일의 PK)
    // 반환값: int (DELETE 성공 시 영향받은 행 수, 보통 1)
    @Override
    public int deleteFileById(Long fileId) {
        return fileMapper.deleteFileById(fileId);
    }

	// 파일 목록 조회 기능
    // 파라미터: FileRequest (검색 조건: 파일명, 대상 타입, 페이징 등)
    // 반환값: List<FileResponse> (조회된 파일 목록)
    @Override
    public List<FileResponse> listFiles(FileRequest req) {
    	//[250923추가]
    	log.info("listFiles:{}", req );
        return fileQueryMapper.selectFiles(req);
    }
    

    /* ================================================================
       [251009 추가] 파일 실제 저장(서버 상대경로 기반) 기능
       목적:
         - 업로드된 파일을 backend 경로 기준으로 저장
         - 확장자에 따라 images / documents / etc 폴더로 구분 저장.
       설명:
         - basePath: 현재 실행 중인 backend 절대경로.
         - 확장자에 따라 subDir(images/documents/etc) 지정.
         - 실제 저장 후 DB에는 상대경로(file/images/파일명) 기록 예정.
       ================================================================ */
    
	@Override
	public String savePhysicalFile(MultipartFile multipartFile) throws IOException {

		// [1] application.yml에 설정된 업로드 루트 경로 읽기
		String baseDir = absoluteUploadRoot;
		log.info("[251010] 업로드 루트 경로: {}", baseDir);

		// [2] 원본 파일명 및 확장자 추출
		String originalName = multipartFile.getOriginalFilename();
		if (originalName == null || !originalName.contains(".")) {
			throw new IllegalArgumentException("파일 이름에 확장자가 없습니다.");
		}
		String ext = originalName.substring(originalName.lastIndexOf(".") + 1).toLowerCase(Locale.ROOT);

		// [3] 확장자에 따라 하위 폴더 분류
		String subDir;
		if (Arrays.asList("jpg", "jpeg", "png", "gif").contains(ext)) {
			subDir = "images";
		} else if (Arrays.asList("txt", "pdf", "hwpx", "pptx", "xlsx", "docx").contains(ext)) {
			subDir = "documents";
		} else {
			subDir = "etc";
		}

		// [4] 실제 물리 경로 생성 (예: C:/.../images/)
		String uploadDir = baseDir + File.separator + subDir;
		File dir = new File(uploadDir);
		if (!dir.exists()) {
			boolean created = dir.mkdirs();
			log.info("[251015] 폴더 생성됨: {} → {}", created, uploadDir);
		}

		// [5] 중복 방지를 위한 UUID 파일명 생성
		String savedName = UUID.randomUUID() + "_" + originalName;
		File saveFile = new File(dir, savedName);
		multipartFile.transferTo(saveFile);
		log.info("[251015] 파일 저장 완료: {}", saveFile.getAbsolutePath());

		// [6] DB 저장용 상대경로 (폴더명부터 시작)
		String relativePath = subDir + "/" + savedName;
		log.info("[251015] DB 기록용 경로: {}", relativePath);

		// [7] 결과 반환
		return relativePath;
	}
     
     
  /* ================================================================
     [251014 추가] 리치에디터 이미지 전용 저장 메서드
     목적:
       - CMS 콘텐츠 작성 시 본문 내 삽입 이미지를 저장
       - 기존 savePhysicalFile()과 같은 root(fileUploadPath) 사용
     설명:
       - baseDir: C:/developer_project/gym_reservation_files/
       - 실제 저장 경로: C:/developer_project/gym_reservation_files/images/editor/
       - 반환값: /images/editor/{uuid}.확장자
     ================================================================ */
	public String saveEditorImage(MultipartFile image) throws IOException {

		// [1] yml에서 주입받은 fileUploadPath 사용
		String baseDir = absoluteUploadRoot; // 이미 주입되어 있음 (fileUploadPath)
		String uploadDir = baseDir + File.separator + "images" + File.separator + "editor";

		// [2] 폴더 존재 여부 확인 및 생성
		File dir = new File(uploadDir);
		if (!dir.exists()) {
			boolean created = dir.mkdirs();
			log.info("[251014] editor 폴더 생성됨: {}", created);
		}

		// [3] 파일명(UUID + 확장자)
		String originalName = image.getOriginalFilename();
		String ext = "";
		int dot = (originalName != null) ? originalName.lastIndexOf(".") : -1;
		if (dot != -1) {
			ext = originalName.substring(dot);
		}
		String uuid = UUID.randomUUID().toString().replace("-", "");
		String newName = uuid + ext;

		// [4] 실제 저장
		File saveFile = new File(dir, newName);
		image.transferTo(saveFile);
		log.info("[251014] 리치에디터 이미지 저장 완료: {}", saveFile.getAbsolutePath());

		// [5] 프론트 접근용 경로 반환
		String relativePath = "/images/editor/" + newName;
		log.info("[251014] 반환 경로: {}", relativePath);
		return relativePath;
	}

}
