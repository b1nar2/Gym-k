package com.gym.domain.post;

import java.time.LocalDateTime;
import lombok.*;

@Getter @Setter @ToString
@NoArgsConstructor @AllArgsConstructor @Builder
public class Post {
    private Long postId;	// 게시글 PK(조회되는 게시글 번호랑은 별도)
    private Long boardId;	// 게시판 ID
    private Long boardPostNo; // [250924 추가] 게시판별 게시글 일련번호(조회되는 게시글 번호)
    private String postTitle; // 게시글 제목
    private String postContent; // 게시글 내용
    private String memberId; // 작성자(회원ID)
    private LocalDateTime postRegDate; // 작성일
    private LocalDateTime postModDate; // 수정일
    private Integer postViewCount; // 조회수(기본값 0으로 설정)
    private Boolean postNotice; // 공지글 여부(true=Y 혹은 false=N...기본은 N으로 설정)
    private Boolean postSecret; // 비밀글 여부(true=Y 혹은 false=N...기본은 N으로 설정)
    private String postType; // 게시글 유형 ('공지' 혹은 '일반'...기본은 '일반'으로 설정)
    private String postFilePath; // [251017 추가] 첨부파일 경로
    
}
