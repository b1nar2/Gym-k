package com.gym.mapper.xml;

import com.gym.domain.file.FileRequest;
import com.gym.domain.file.FileResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param; // [250923추가] 파라미터 이름 바인딩용
import org.apache.ibatis.annotations.Select;
import java.util.List;

/**
 * 파일 요청 DTO
 * - 파일 업로드/등록/수정 시 요청 값 전달용
 * - DB 테이블 컬럼명과 동일하게 작성
 */
@Mapper
public interface FileQueryMapper {
	/*
	List<FileResponse> selectFiles(@Param("page") Integer page,
                                   @Param("size") Integer size,
                                   @Param("targetType") String targetType,
                                   @Param("targetId") String targetId);

    long countFiles(@Param("targetType") String targetType,
                    @Param("targetId") String targetId);
    */
    // ✅ FileRequest 객체 하나로 검색 조건 처리 (fileId, fileName, fileTargetType)
    List<FileResponse> selectFiles(FileRequest req);
    
    // ✅ 파일명 단건 조회 (다운로드/미리보기에서 사용)
    @Select("""
        SELECT * FROM (
          SELECT
            file_id,
            member_id,
            file_target_type,
            file_target_id,
            file_name,
            file_path,
            file_type,
            file_ext,
            file_size,
            file_reg_date
          FROM file_tbl
          WHERE file_name = #{fileName}
          ORDER BY file_id DESC
        )
        WHERE ROWNUM = 1
    """)
    FileResponse selectFileByName(@Param("fileName") String fileName);
}
