package com.hercycle.service;

import com.hercycle.dto.request.VideoRequest;
import com.hercycle.dto.response.VideoResponse;

import java.util.List;

/**
 * Service interface for Admin managing YouTube videos, and users viewing/searching/bookmarking resources.
 */
public interface SelfCareService {

    VideoResponse addVideo(VideoRequest request);

    VideoResponse updateVideo(Long id, VideoRequest request);

    void deleteVideo(Long id);

    List<VideoResponse> viewVideos();

    List<VideoResponse> searchVideos(String query);

    List<VideoResponse> filterCategory(String category);

    // --- Bookmarking Methods ---

    VideoResponse bookmarkVideo(Long videoId);

    void removeBookmark(Long videoId);

    List<VideoResponse> getBookmarkedVideos();
}
