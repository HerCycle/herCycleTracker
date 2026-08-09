package com.hercycle.repository;

import com.hercycle.entity.SelfCare;
import com.hercycle.entity.User;
import com.hercycle.entity.VideoBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for VideoBookmark entity.
 */
@Repository
public interface VideoBookmarkRepository extends JpaRepository<VideoBookmark, Long> {

    List<VideoBookmark> findByUser(User user);

    Optional<VideoBookmark> findByUserAndVideo(User user, SelfCare video);
}
