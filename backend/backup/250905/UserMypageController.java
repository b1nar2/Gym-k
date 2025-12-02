package com.gym.controller.user; // 📦 컨트롤러 패키지

import com.gym.common.ApiResponse;
import 
import com.gym.domain.member.MemberCreateRequest;
import com.gym.domain.member.MemberUpdateRequest;
import com.gym.domain.member.MemberResponse;
import com.gym.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class UserMypageController {

    private final MemberService memberService;

    @Operation(summary = "회원 단건 조회", description = "memberId로 member_tbl 단건 조회")
    @GetMapping("/{memberId}")
    public ApiResponse<MemberResponse> getMemberById(
            @Parameter(description = "회원 ID (예: hong1 ~ hong10)")
            @PathVariable("memberId") String memberId
    ) {
        Member m = memberService.getMemberById(memberId);
        MemberResponse res = toResponse(m);
        return ApiResponse.ok(res);
    }

    @Operation(summary = "회원 등록", description = "회원 정보를 등록합니다.")
    @PostMapping
    public ApiResponse<Integer> createMember(@RequestBody MemberCreateRequest req) {
        int affected = memberService.createMember(req);
        return ApiResponse.ok(affected);
    }

    @Operation(summary = "회원 수정", description = "회원 정보를 수정합니다(회원ID/회원명은 수정 불가).")
    @PutMapping("/{memberId}")
    public ApiResponse<Integer> updateMember(
            @PathVariable("memberId") String memberId,
            @RequestBody MemberUpdateRequest req
    ) {
        int affected = memberService.updateMember(memberId, req);
        return ApiResponse.ok(affected);
    }

    @Operation(summary = "회원 삭제", description = "회원ID로 회원을 삭제합니다.")
    @DeleteMapping("/{memberId}")
    public ApiResponse<Integer> deleteMember(@PathVariable("memberId") String memberId) {
        int affected = memberService.deleteMember(memberId);
        return ApiResponse.ok(affected);
    }

    private MemberResponse toResponse(Member m) {
        MemberResponse res = new MemberResponse();
        res.setMemberId(m.getMemberId());
        res.setMemberName(m.getMemberName());
        res.setMemberGender(m.getMemberGender());
        res.setMemberEmail(m.getMemberEmail());
        res.setMemberMobile(m.getMemberMobile());
        res.setMemberPhone(m.getMemberPhone());
        res.setZip(m.getZip());
        res.setRoadAddress(m.getRoadAddress());
        res.setJibunAddress(m.getJibunAddress());
        res.setDetailAddress(m.getDetailAddress());
        res.setMemberBirthday(m.getMemberBirthday());
        res.setMemberManipay(m.getMemberManipay());
        res.setMemberJoindate(m.getMemberJoindate());
        res.setMemberRole(m.getMemberRole());
        res.setAdminType(m.getAdminType());
        return res;
    }
}

