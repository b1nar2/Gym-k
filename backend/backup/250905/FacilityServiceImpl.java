package com.gym.service.impl;

import com.gym.common.PageResponse;
import com.gym.domain.facility.*;
import com.gym.mapper.annotation.FacilityMapper;
import com.gym.mapper.xml.FacilityQueryMapper;
import com.gym.service.FacilityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FacilityServiceImpl implements FacilityService {

    private final FacilityMapper facilityMapper;
    private final FacilityQueryMapper facilityQueryMapper;

    public FacilityServiceImpl(FacilityMapper facilityMapper, FacilityQueryMapper facilityQueryMapper) {
        this.facilityMapper = facilityMapper;
        this.facilityQueryMapper = facilityQueryMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createFacility(FacilityCreateRequest req) {
        // 필수값 검증
        if (req.getFacilityName() == null || req.getFacilityName().isBlank())
            throw new IllegalArgumentException("facilityName is required");
        if (req.getFacilityPersonMax() == null || req.getFacilityPersonMin() == null)
            throw new IllegalArgumentException("personMax/personMin are required");
        if (req.getFacilityPersonMin() > req.getFacilityPersonMax())
            throw new IllegalArgumentException("facilityPersonMin <= facilityPersonMax");

        Facility f = Facility.builder()
                .facilityName(req.getFacilityName())
                .memberId(req.getMemberId())
                .facilityPhone(req.getFacilityPhone())
                .facilityContent(req.getFacilityContent())
                .facilityImagePath(req.getFacilityImagePath())
                .facilityPersonMax(req.getFacilityPersonMax())
                .facilityPersonMin(req.getFacilityPersonMin())
                .facilityUse(req.getFacilityUse() != null ? req.getFacilityUse() : true) // null → true 기본
                .facilityOpenTime(req.getFacilityOpenTime())
                .facilityCloseTime(req.getFacilityCloseTime())
                .facilityMoney(req.getFacilityMoney() != null ? req.getFacilityMoney() : 0L)
                .facilityType(req.getFacilityType()) 
                .build();

        int affected = facilityMapper.insertFacility(f);
        if (affected != 1) throw new RuntimeException("INSERT failed");

        // @SelectKey 로 주입된 PK 반환
        return f.getFacilityId();
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityResponse getFacilityById(Long facilityId) {
        Facility f = facilityMapper.selectFacilityById(facilityId);
        if (f == null) throw new RuntimeException("NOT_FOUND: facility " + facilityId);
        return toResp(f);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FacilityResponse> searchFacilities(String name, Boolean facilityUse,
                                                           Integer page, Integer size, String sort) {
        List<Facility> items = facilityQueryMapper.selectFacilities(name, facilityUse, page, size, sort);
        long total = facilityQueryMapper.countFacilities(name, facilityUse);
        return PageResponse.of(items.stream().map(this::toResp).toList(), total, page, size);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateFacility(Long facilityId, FacilityUpdateRequest req) {
        Facility target = facilityMapper.selectFacilityById(facilityId);
        if (target == null) throw new RuntimeException("NOT_FOUND: facility " + facilityId);

        if (req.getFacilityName() != null)       target.setFacilityName(req.getFacilityName());
        if (req.getMemberId() != null)           target.setMemberId(req.getMemberId());
        if (req.getFacilityPhone() != null)      target.setFacilityPhone(req.getFacilityPhone());
        if (req.getFacilityContent() != null)    target.setFacilityContent(req.getFacilityContent());
        if (req.getFacilityImagePath() != null)  target.setFacilityImagePath(req.getFacilityImagePath());
        if (req.getFacilityPersonMax() != null)  target.setFacilityPersonMax(req.getFacilityPersonMax());
        if (req.getFacilityPersonMin() != null)  target.setFacilityPersonMin(req.getFacilityPersonMin());
        if (req.getFacilityUse() != null)        target.setFacilityUse(req.getFacilityUse());
        if (req.getFacilityOpenTime() != null)   target.setFacilityOpenTime(req.getFacilityOpenTime());
        if (req.getFacilityCloseTime() != null)  target.setFacilityCloseTime(req.getFacilityCloseTime());
        if (req.getFacilityMoney() != null)      target.setFacilityMoney(req.getFacilityMoney());

        if (target.getFacilityPersonMin() != null && target.getFacilityPersonMax() != null
                && target.getFacilityPersonMin() > target.getFacilityPersonMax())
            throw new IllegalArgumentException("facilityPersonMin <= facilityPersonMax");

        int affected = facilityMapper.updateFacility(target);
        if (affected == 0) throw new RuntimeException("UPDATE failed");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteFacilityById(Long facilityId) {
        int affected = facilityMapper.deleteFacilityById(facilityId);
        if (affected == 0) throw new RuntimeException("NOT_FOUND: facility " + facilityId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changeFacilityUse(Long facilityId, boolean facilityUse) {
        int affected = facilityMapper.updateFacilityUse(facilityId, facilityUse);
        if (affected == 0) throw new RuntimeException("NOT_FOUND: facility " + facilityId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsFacilityById(Long facilityId) {
        return facilityMapper.existsFacilityById(facilityId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countFacilities(String name, Boolean facilityUse) {
        return facilityQueryMapper.countFacilities(name, facilityUse);
    }

    private FacilityResponse toResp(Facility f) {
        return FacilityResponse.builder()
                .facilityId(f.getFacilityId())
                .facilityName(f.getFacilityName())
                .memberId(f.getMemberId())
                .facilityPhone(f.getFacilityPhone())
                .facilityContent(f.getFacilityContent())
                .facilityImagePath(f.getFacilityImagePath())
                .facilityPersonMax(f.getFacilityPersonMax())
                .facilityPersonMin(f.getFacilityPersonMin())
                .facilityUse(f.isFacilityUse())
                .facilityRegDate(f.getFacilityRegDate())
                .facilityModDate(f.getFacilityModDate())
                .facilityOpenTime(f.getFacilityOpenTime())
                .facilityCloseTime(f.getFacilityCloseTime())
                .facilityMoney(f.getFacilityMoney())
                .build();
    }
}
