package com.hercycle.service.impl;

import com.hercycle.dto.request.VideoRequest;
import com.hercycle.dto.response.VideoResponse;
import com.hercycle.entity.SelfCare;
import com.hercycle.entity.SelfCareCategory;
import com.hercycle.entity.User;
import com.hercycle.entity.VideoBookmark;
import com.hercycle.exception.BadRequestException;
import com.hercycle.exception.ResourceNotFoundException;
import com.hercycle.mapper.EntityMapper;
import com.hercycle.repository.SelfCareRepository;
import com.hercycle.repository.VideoBookmarkRepository;
import com.hercycle.service.SelfCareService;
import com.hercycle.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service implementation for SelfCare videos.
 */
@Service
@Transactional
public class SelfCareServiceImpl implements SelfCareService {

    private static final Logger logger = LoggerFactory.getLogger(SelfCareServiceImpl.class);

    private final SelfCareRepository selfCareRepository;
    private final VideoBookmarkRepository bookmarkRepository;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public SelfCareServiceImpl(SelfCareRepository selfCareRepository, VideoBookmarkRepository bookmarkRepository,
                               UserService userService, EntityMapper entityMapper) {
        this.selfCareRepository = selfCareRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Override
    public VideoResponse addVideo(VideoRequest request) {
        logger.info("Admin adding self care video: {}", request.getTitle());
        SelfCare video = SelfCare.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(SelfCareCategory.valueOf(request.getCategory().toUpperCase()))
                .thumbnail(request.getThumbnail())
                .youtubeUrl(request.getYoutubeUrl())
                .build();

        SelfCare saved = selfCareRepository.save(video);
        return entityMapper.toVideoResponse(saved);
    }

    @Override
    public VideoResponse updateVideo(Long id, VideoRequest request) {
        logger.info("Admin updating self care video ID: {}", id);
        SelfCare video = selfCareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video log not found with ID: " + id));

        video.setTitle(request.getTitle());
        video.setDescription(request.getDescription());
        video.setCategory(SelfCareCategory.valueOf(request.getCategory().toUpperCase()));
        video.setThumbnail(request.getThumbnail());
        video.setYoutubeUrl(request.getYoutubeUrl());

        SelfCare updated = selfCareRepository.save(video);
        return entityMapper.toVideoResponse(updated);
    }

    @Override
    public void deleteVideo(Long id) {
        logger.info("Admin deleting self care video ID: {}", id);
        SelfCare video = selfCareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video log not found with ID: " + id));
        selfCareRepository.delete(video);
    }

    @Override
    public List<VideoResponse> viewVideos() {
        return selfCareRepository.findAll().stream()
                .map(entityMapper::toVideoResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VideoResponse> searchVideos(String query) {
        logger.info("Searching self care videos with query: {}", query);
        return selfCareRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query).stream()
                .map(entityMapper::toVideoResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<VideoResponse> filterCategory(String category) {
        logger.info("Filtering self care videos by category: {}", category);
        SelfCareCategory enumCat = SelfCareCategory.valueOf(category.toUpperCase());
        return selfCareRepository.findByCategory(enumCat).stream()
                .map(entityMapper::toVideoResponse)
                .collect(Collectors.toList());
    }

    // --- Bookmarking Implementations ---

    @Override
    public VideoResponse bookmarkVideo(Long videoId) {
        User user = userService.getLoggedInUser();
        logger.info("User {} bookmarking video ID {}", user.getEmail(), videoId);

        SelfCare video = selfCareRepository.findById(videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with ID: " + videoId));

        Optional<VideoBookmark> existing = bookmarkRepository.findByUserAndVideo(user, video);
        if (existing.isPresent()) {
            return entityMapper.toVideoResponse(video);
        }

        VideoBookmark bookmark = VideoBookmark.builder()
                .user(user)
                .video(video)
                .build();

        bookmarkRepository.save(bookmark);
        return entityMapper.toVideoResponse(video);
    }

    @Override
    public void removeBookmark(Long videoId) {
        User user = userService.getLoggedInUser();
        logger.info("User {} removing bookmark on video ID {}", user.getEmail(), videoId);

        SelfCare video = selfCareRepository.findById(videoId)
                .orElseThrow(() -> new ResourceNotFoundException("Video not found with ID: " + videoId));

        VideoBookmark bookmark = bookmarkRepository.findByUserAndVideo(user, video)
                .orElseThrow(() -> new ResourceNotFoundException("Video bookmark not found"));

        bookmarkRepository.delete(bookmark);
    }

    @Override
    public List<VideoResponse> getBookmarkedVideos() {
        User user = userService.getLoggedInUser();
        logger.info("Fetching bookmarks for user {}", user.getEmail());
        return bookmarkRepository.findByUser(user).stream()
                .map(VideoBookmark::getVideo)
                .map(entityMapper::toVideoResponse)
                .collect(Collectors.toList());
    }
}
