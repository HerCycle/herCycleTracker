package com.hercycle.controller;

import com.hercycle.dto.ApiResponse;
import com.hercycle.dto.request.VideoRequest;
import com.hercycle.dto.response.VideoResponse;
import com.hercycle.service.SelfCareService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Self-Care video content.
 */
@RestController
@RequestMapping("/api")
public class SelfCareController {

    private final SelfCareService selfCareService;

    public SelfCareController(SelfCareService selfCareService) {
        this.selfCareService = selfCareService;
    }

    // --- User Video Endpoints ---

    @GetMapping("/self-care")
    public ResponseEntity<ApiResponse<List<VideoResponse>>> viewVideos() {
        List<VideoResponse> response = selfCareService.viewVideos();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/self-care/search")
    public ResponseEntity<ApiResponse<List<VideoResponse>>> searchVideos(@RequestParam String query) {
        List<VideoResponse> response = selfCareService.searchVideos(query);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/self-care/category/{category}")
    public ResponseEntity<ApiResponse<List<VideoResponse>>> filterCategory(@PathVariable String category) {
        List<VideoResponse> response = selfCareService.filterCategory(category);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- Bookmarking Endpoints ---

    @PostMapping("/self-care/bookmark/{videoId}")
    public ResponseEntity<ApiResponse<VideoResponse>> bookmarkVideo(@PathVariable Long videoId) {
        VideoResponse response = selfCareService.bookmarkVideo(videoId);
        return ResponseEntity.ok(ApiResponse.success("Video bookmarked successfully", response));
    }

    @DeleteMapping("/self-care/bookmark/{videoId}")
    public ResponseEntity<ApiResponse<Void>> removeBookmark(@PathVariable Long videoId) {
        selfCareService.removeBookmark(videoId);
        return ResponseEntity.ok(ApiResponse.success("Bookmark removed successfully"));
    }

    @GetMapping("/self-care/bookmarks")
    public ResponseEntity<ApiResponse<List<VideoResponse>>> getBookmarkedVideos() {
        List<VideoResponse> response = selfCareService.getBookmarkedVideos();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- Admin Video Endpoints ---

    @PostMapping("/admin/self-care")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VideoResponse>> addVideo(@Valid @RequestBody VideoRequest request) {
        VideoResponse response = selfCareService.addVideo(request);
        return ResponseEntity.ok(ApiResponse.success("Video added successfully by Admin", response));
    }

    @PutMapping("/admin/self-care/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VideoResponse>> updateVideo(@PathVariable Long id, @Valid @RequestBody VideoRequest request) {
        VideoResponse response = selfCareService.updateVideo(id, request);
        return ResponseEntity.ok(ApiResponse.success("Video updated successfully by Admin", response));
    }

    @DeleteMapping("/admin/self-care/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVideo(@PathVariable Long id) {
        selfCareService.deleteVideo(id);
        return ResponseEntity.ok(ApiResponse.success("Video deleted successfully by Admin"));
    }
}
