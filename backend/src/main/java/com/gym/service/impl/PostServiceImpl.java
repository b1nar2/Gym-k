package com.gym.service.impl;

import com.gym.domain.post.PostResponse;
import com.gym.domain.post.Post;                 // ★ 추가
import com.gym.mapper.xml.PostMapper;
import com.gym.service.PostService;

import lombok.extern.log4j.Log4j2;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@CrossOrigin("*") // 251017 추가
@Log4j2 // 251017 추가
@Service
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;

    public PostServiceImpl(PostMapper postMapper) {
        this.postMapper = postMapper;
    }

    /**
     * 게시글 등록 처리
     *
     * @param postResponse 게시글 DTO (등록일, 수정일은 DB SYSDATE 자동 처리)
     * @return 생성된 게시글 ID
     */
    // ===== [원본 보존] =====
    // @Override
    // @Transactional
    // public Long createPost(PostResponse postResponse) {
    //     // 필요시 PostResponse -> Post 엔티티 변환 로직 추가 가능
    //     return postMapper.insertPost(postResponse);
    // }

    // ===== [수정본] ✏️ INSERT 전 사전검증 + 엔티티 변환 + AFTER CURRVAL 회수 =====
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createPost(PostResponse postResponse) {
    	
    	//--------------------------- [251017] 게시글 등록 요청 로그 기록 ---------------------------
        log.info("[게시글 등록 요청] boardId={}, memberId={}, title={}, filePath={}",
                postResponse.getBoardId(),
                postResponse.getMemberId(),
                postResponse.getPostTitle(),
                postResponse.getPostFilePath());
        //--------------------------- [251017] 게시글 등록 요청 로그 기록 ---------------------------
        
        //--------------------------- [첨부파일 로그] 등록 요청 시 전달된 경로 ---------------------------
        log.info("[첨부파일 등록 요청] postId(임시)=null, boardId={}, memberId={}, 전달된 postFilePath={}",
                postResponse.getBoardId(),
                postResponse.getMemberId(),
                postResponse.getPostFilePath());
        //--------------------------- [첨부파일 로그] 등록 요청 시 전달된 경로 ---------------------------
        
        // [1] 필수값 검증 (INSERT 진입 전)
        if (postResponse.getBoardId() == null)
            throw new IllegalArgumentException("boardId is required");
        if (postResponse.getMemberId() == null || postResponse.getMemberId().isBlank())
            throw new IllegalArgumentException("memberId is required");
        if (postResponse.getPostTitle() == null || postResponse.getPostTitle().isBlank())
            throw new IllegalArgumentException("postTitle is required");
        if (postResponse.getPostContent() == null || postResponse.getPostContent().isBlank())
            throw new IllegalArgumentException("postContent is required");

        // [2] FK 사전검증 (실패 시 INSERT 진입 금지 → NEXTVAL 미호출)
        if (!postMapper.existsBoardId(postResponse.getBoardId()))
            throw new IllegalArgumentException("boardId not found");
        if (!postMapper.existsMemberId(postResponse.getMemberId()))
            throw new IllegalArgumentException("memberId not found");

        // [3] DTO → 엔티티(Post) 변환
        Post p = Post.builder()
                .boardId(postResponse.getBoardId())
                .postTitle(postResponse.getPostTitle())
                .postContent(postResponse.getPostContent())
                .memberId(postResponse.getMemberId())
                .postNotice(Boolean.TRUE.equals(postResponse.getPostNotice()))
                .postSecret(Boolean.TRUE.equals(postResponse.getPostSecret()))
                .postType(postResponse.getPostType())
                .postFilePath(postResponse.getPostFilePath()) // [251017] 첨부파일 경로 추가
                .build();
        
        //--------------------------- DB INSERT 전 변환 로그 기록 ---------------------------
        log.info("[Service 변환 완료] 엔티티 생성: {}", p);
        //--------------------------- DB INSERT 전 변환 로그 기록 ---------------------------
        
        //--------------------------- [첨부파일 로그] DB 등록 완료 후 실제 저장된 경로 ---------------------------
        log.info("[첨부파일 등록 완료] postId={}, DB 저장된 postFilePath={}", p.getPostId(), p.getPostFilePath());
        //--------------------------- [첨부파일 로그] DB 등록 완료 후 실제 저장된 경로 ---------------------------
        
        // [4] INSERT (VALUES에 NEXTVAL, AFTER selectKey로 p.postId 주입)
        int n = postMapper.insertPost(p);

        //--------------------------- DB INSERT 결과 로그 기록 ---------------------------
        log.info("[DB INSERT 결과] n={}, postId={}, filePath={}", n, p.getPostId(), p.getPostFilePath());
        //--------------------------- DB INSERT 결과 로그 기록 ---------------------------

        if (n != 1) throw new RuntimeException("INSERT failed");

        //--------------------------- [첨부파일 로그] DB 등록 완료 후 실제 저장된 경로 ---------------------------
        log.info("[첨부파일 등록 완료] postId={}, DB 저장된 postFilePath={}", p.getPostId(), p.getPostFilePath());
        //--------------------------- [첨부파일 로그] DB 등록 완료 후 실제 저장된 경로 ---------------------------


        //--------------------------- 등록 완료 로그 기록 ---------------------------
        log.info("[등록 완료] postId={} (filePath={})", p.getPostId(), p.getPostFilePath());
        //--------------------------- 등록 완료 로그 기록 ---------------------------
        
        // [5] 새 PK 반환 (AFTER selectKey로 채워짐)
        return p.getPostId();
    }

    /** 게시판별 게시글 목록 조회 (페이징, 검색, 공지 필터 포함) */
    @Override
    @Transactional(readOnly = true)
    public List<PostResponse> getPostsByBoard(Long boardId, int page, int size, String keyword, Boolean notice) {
        int offset = (page - 1) * size;

        String noticeStr = null;
        if (notice != null) noticeStr = notice ? "Y" : "N";

        return postMapper.selectPostsByBoard(boardId, offset, size, keyword, noticeStr);
    }

    /** 게시글 단건 조회 */
    @Override
    @Transactional(readOnly = true)
    public PostResponse getPostById(Long postId) {
        return postMapper.selectPostById(postId);
    }

    /** 게시글 수정 처리 */
    @Override
    @Transactional
    public void updatePost(PostResponse postResponse) {
    	
    	//--------------------------- 게시글 수정 요청 로그 기록 ---------------------------
        log.info("[게시글 수정 요청] postId={}, title={}, filePath={}",
                postResponse.getPostId(),
                postResponse.getPostTitle(),
                postResponse.getPostFilePath());
        //--------------------------- 게시글 수정 요청 로그 기록 ---------------------------
        
        //--------------------------- [첨부파일 로그] 수정 요청 시 전달된 경로 ---------------------------
        log.info("[첨부파일 수정 요청] postId={}, 전달된 postFilePath={}", postResponse.getPostId(), postResponse.getPostFilePath());
        //--------------------------- [첨부파일 로그] 수정 요청 시 전달된 경로 ---------------------------
        
        int updatedCount = postMapper.updatePost(postResponse);
        
        //--------------------------- DB UPDATE 결과 로그 기록 ---------------------------
        log.info("[DB UPDATE 결과] updatedCount={}, postId={}", updatedCount, postResponse.getPostId());
        //--------------------------- DB UPDATE 결과 로그 기록 ---------------------------
        
        if (updatedCount == 0) {
            throw new RuntimeException("수정할 게시글이 존재하지 않습니다. postId=" + postResponse.getPostId());
        }
        //--------------------------- [첨부파일 로그] 수정 후 DB 반영 확인 ---------------------------
        log.info("[첨부파일 수정 완료] postId={}, 변경 후 postFilePath={}", postResponse.getPostId(), postResponse.getPostFilePath());
        //--------------------------- [첨부파일 로그] 수정 후 DB 반영 확인 ---------------------------
        
        //--------------------------- 수정 완료 로그 기록 ---------------------------
        log.info("[수정 완료] postId={} filePath={}", postResponse.getPostId(), postResponse.getPostFilePath());
        //--------------------------- 수정 완료 로그 기록 ---------------------------
        
    }

    /** 게시글 삭제 */
    @Override
    @Transactional
    public void deletePostById(Long postId) {
    	
    	//--------------------------- 게시글 삭제 요청 로그 기록 ---------------------------
        log.info("[게시글 삭제 요청] postId={}", postId);
        //--------------------------- 게시글 삭제 요청 로그 기록 ---------------------------
        
        int deletedCount = postMapper.deletePostById(postId);
        
        //--------------------------- DB DELETE 결과 로그 기록 ---------------------------
        log.info("[DB DELETE 결과] deletedCount={}, postId={}", deletedCount, postId);
        //--------------------------- DB DELETE 결과 로그 기록 ---------------------------
        
        if (deletedCount == 0) {
            throw new RuntimeException("삭제할 게시글이 존재하지 않습니다. postId=" + postId);
        }
        //--------------------------- 삭제 완료 로그 기록 ---------------------------
        log.info("[삭제 완료] postId={}", postId);
        //--------------------------- 삭제 완료 로그 기록 ---------------------------
    }

    /** 게시판별 게시글 개수 조회 (검색 및 공지 필터 포함) */
    @Override
    @Transactional(readOnly = true)
    public int countPostsByBoard(Long boardId, String keyword, Boolean notice) {

        return postMapper.countPostsByBoard(boardId, keyword, notice);
    }
    
    /** 게시판별 게시글 조회 */
    @Override
    public void increaseViewCount(Long postId) {
        postMapper.increaseViewCount(postId); // [250925추가] 매퍼 호출
    }
}