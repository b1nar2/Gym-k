package com.gym.service.impl;

import com.gym.domain.content.*;
import com.gym.mapper.annotation.ContentMapper;
import com.gym.service.ContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;

import org.springframework.web.multipart.MultipartFile;   // [251013] 파일 업로드용
import com.gym.service.FileService;                     // [251013] 파일 저장 서비스 연동
import java.io.IOException;                             // [251013] 파일 입출력 예외

import java.util.List;

/**
 * 콘텐츠 서비스 구현체
 * - DB 트랜잭션 단위로 CRUD 수행
 * - INSERT 성공 시에만 PK 증가 후 Swagger 응답으로 반환
 */
@Service
@RequiredArgsConstructor
public class ContentServiceImpl implements ContentService {

    private final ContentMapper contentMapper;
    private final FileService fileService; // ⚠️ [251013추가] 파일 업로드 기능 사용

    /**
     * 콘텐츠 등록 (PK 반환)
     * - INSERT 성공 시 오라클 시퀀스 NEXTVAL → CURRVAL 사용
     * - 실패 시 롤백 처리되어 PK 증가하지 않음
     */
    @Override
	@Transactional(rollbackFor = Exception.class)
	//public Long createContent(ContentCreateRequest request) {
    public Long createContent(ContentCreateRequest request, MultipartFile file) throws IOException { // 첨부파일 기능 추가

    	// -------------- ⚠️ [251013추가] 파일 첨부가 있는 경우 업로드 처리 --------------
        if (file != null && !file.isEmpty()) {
            String path = fileService.savePhysicalFile(file); // 파일 저장 (FileService 사용)
            request.setContentFilePath(path); // DB 저장용 상대경로 주입
        }
        // -------------- ⚠️ [251013추가] 파일 첨부가 있는 경우 업로드 처리 --------------
        
		Long result = -1L; // [추가] 비정상(-1L)으로 지정

		try {
			int affected = contentMapper.createContent(request);
			if (affected == 0) {
				throw new RuntimeException("콘텐츠 등록 실패");
			}
			// return contentMapper.getLastContentId();
			result = contentMapper.getLastContentId();
			
			// -----------------[251012] 중복 예외 메시지 개선---------------------
		} catch (DuplicateKeyException e) {
			ContentResponse existing = null;
			try {
				existing = contentMapper.findByContentNum(request.getContentNum());
			} catch (Exception ignore) {
			}

			String existingTitle = (existing != null && existing.getContentTitle() != null) ? existing.getContentTitle()
					: "(기존 제목 조회 실패)";
			String existingType = (existing != null && existing.getContentType() != null) ? existing.getContentType()
					: "(미지정)";

			String newTitle = (request.getContentTitle() != null && !request.getContentTitle().isEmpty())
					? request.getContentTitle()
					: "(신규 제목 없음)";
			Integer num = (request.getContentNum() != null) ? request.getContentNum() : -1;

			String detailMsg = String.format("[%s] \"%s\" 콘텐츠의 정렬번호(%d)는 이미 [%s] \"%s\" 콘텐츠에 사용 중입니다.",
					request.getContentType(), newTitle, num, existingType, existingTitle);

			System.err.println("⚠️ DuplicateKeyException 발생: " + detailMsg);
			throw new DuplicateKeyException(detailMsg, e);

		} catch (DataIntegrityViolationException e) {
			String msg = e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : "";
			if (msg.contains("CONTENTS_TBL_NUM_UN") || msg.contains("ORA-00001")) {
				ContentResponse existing = null;
				try {
					existing = contentMapper.findByContentNum(request.getContentNum());
				} catch (Exception ignore) {
				}

				String existingTitle = (existing != null && existing.getContentTitle() != null)
						? existing.getContentTitle()
						: "(기존 제목 조회 실패)";
				String existingType = (existing != null && existing.getContentType() != null)
						? existing.getContentType()
						: "(미지정)";

				String newTitle = (request.getContentTitle() != null && !request.getContentTitle().isEmpty())
						? request.getContentTitle()
						: "(신규 제목 없음)";
				Integer num = (request.getContentNum() != null) ? request.getContentNum() : -1;

				String detailMsg = String.format("[%s] \"%s\" 콘텐츠의 정렬번호(%d)는 이미 [%s] \"%s\" 콘텐츠에 사용 중입니다.",
						request.getContentType(), newTitle, num, existingType, existingTitle);

				System.err.println("⚠️ DataIntegrityViolationException 발생: " + detailMsg);
				throw new DuplicateKeyException(detailMsg, e);
			}
			throw e;
			// -----------------[251012] 중복 예외 메시지 개선---------------------
		}

		return result;
	}
    
    

    /**
     * 콘텐츠 단건 조회
     * - CMS 관리자/책임자/관리자 권한 필요
     * - 일반 사용자도 조회 가능(권한 구분은 Controller 단에서 처리)
     */
    @Override
    public ContentResponse getContentById(Long contentId) {
        return contentMapper.getContentById(contentId);
    }

    /**
     * 콘텐츠 목록 조회
     * - ContentSearchRequest 조건이 Mapper에 구현되어 있어야 함
     */
    @Override
    public List<ContentResponse> listContents(ContentSearchRequest request) {
        // [old] 단순 전체 조회
        // return contentMapper.listContents(request);

        // [250917] 검색 조건이 없다면 전체조회, 조건이 있다면 조건검색
        if (request == null) {
            return contentMapper.listContents(new ContentSearchRequest()); // 빈 조건으로 전체조회
        }
        return contentMapper.listContents(request);
    }

    /**
     * 콘텐츠 수정
     */
    @Override
    @Transactional(rollbackFor = Exception.class) // [250917] 트랜잭션 보장 추가
	public int updateContent(ContentUpdateRequest request) {
		try { // 251012 추가
			int affected = contentMapper.updateContent(request);
			if (affected == 0) {
				throw new RuntimeException("콘텐츠 수정 실패: ID=" + request.getContentId());
			}
			return affected;
			// -----------------[251012] 중복 예외 메시지 개선---------------------
		} catch (DuplicateKeyException e) {
			ContentResponse existing = null;
			try {
				existing = contentMapper.findByContentNum(request.getContentNum());
			} catch (Exception ignore) {
			}

			String existingTitle = (existing != null && existing.getContentTitle() != null) ? existing.getContentTitle()
					: "(기존 제목 조회 실패)";
			String existingType = (existing != null && existing.getContentType() != null) ? existing.getContentType()
					: "(미지정)";

			String newTitle = (request.getContentTitle() != null && !request.getContentTitle().isEmpty())
					? request.getContentTitle()
					: "(신규 제목 없음)";
			Integer num = (request.getContentNum() != null) ? request.getContentNum() : -1;

			String detailMsg = String.format("[%s] \"%s\" 콘텐츠의 정렬번호(%d)는 이미 [%s] \"%s\" 콘텐츠에 사용 중입니다.",
					request.getContentType(), newTitle, num, existingType, existingTitle);

			System.err.println("⚠️ DuplicateKeyException 발생(수정): " + detailMsg);
			throw new DuplicateKeyException(detailMsg, e);

		} catch (DataIntegrityViolationException e) {
			String msg = e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : "";
			if (msg.contains("CONTENTS_TBL_NUM_UN") || msg.contains("ORA-00001")) {
				ContentResponse existing = null;
				try {
					existing = contentMapper.findByContentNum(request.getContentNum());
				} catch (Exception ignore) {
				}

				String existingTitle = (existing != null && existing.getContentTitle() != null)
						? existing.getContentTitle()
						: "(기존 제목 조회 실패)";
				String existingType = (existing != null && existing.getContentType() != null)
						? existing.getContentType()
						: "(미지정)";

				String newTitle = (request.getContentTitle() != null && !request.getContentTitle().isEmpty())
						? request.getContentTitle()
						: "(신규 제목 없음)";
				Integer num = (request.getContentNum() != null) ? request.getContentNum() : -1;

				String detailMsg = String.format("[%s] \"%s\" 콘텐츠의 정렬번호(%d)는 이미 [%s] \"%s\" 콘텐츠에 사용 중입니다.",
						request.getContentType(), newTitle, num, existingType, existingTitle);

				System.err.println("⚠️ DataIntegrityViolationException 발생(수정): " + detailMsg);
				throw new DuplicateKeyException(detailMsg, e);
			}
			throw e;
		}
		// -----------------[251012] 중복 예외 메시지 개선---------------------

	}

    /**
     * 콘텐츠 삭제
     */
    @Override
    @Transactional(rollbackFor = Exception.class) // [250917] 트랜잭션 보장 추가
    public int deleteContentById(Long contentId) {
        int affected = contentMapper.deleteContentById(contentId);
        if (affected == 0) {
            throw new RuntimeException("콘텐츠 삭제 실패: ID=" + contentId);
        }
        return affected;
    }
    
    
    // -----------------[251013] 첨부파일 기능 ---------------------
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createContent(ContentCreateRequest request) {
        // 파일 없이 호출됐을 때 file=null로 위 메서드 재사용
        try {
            return createContent(request, null); // 파일 없는 버전 → 파일 인자 null 전달
        } catch (IOException e) {
            throw new RuntimeException("파일 없는 콘텐츠 등록 중 오류 발생", e);
        }
    }
    // -----------------[251013] 첨부파일 기능 ---------------------
    
    
}
