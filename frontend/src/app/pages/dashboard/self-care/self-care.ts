import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelfCareService, SelfCareVideo } from '../../../services/self-care.service';

export interface CategoryOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-self-care',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './self-care.html',
  styleUrl: './self-care.scss'
})
export class SelfCarePage implements OnInit {
  private readonly selfCareService = inject(SelfCareService);

  // Tab state: 'ALL' | 'BOOKMARKS'
  readonly currentTab = signal<'ALL' | 'BOOKMARKS'>('ALL');

  readonly allVideos = signal<SelfCareVideo[]>([]);
  readonly selectedCategory = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly bookmarkedIds = signal<Set<string>>(new Set());
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly categories: CategoryOption[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Exercise', value: 'Exercise' },
    { label: 'Nutrition', value: 'Nutrition' },
    { label: 'Hygiene', value: 'Hygiene' }
  ];

  // Combined Filtering: Tab (All vs Bookmarks) + Category + Search + Reliability Validation
  readonly filteredVideos = computed(() => {
    let list = this.allVideos();

    // Exclude any video with missing metadata, generic title, inactive status, or failed thumbnail
    const failed = this.failedImages();
    list = list.filter(
      (v) =>
        v.active !== false &&
        v.title &&
        v.title.trim() !== '' &&
        v.title.trim().toLowerCase() !== 'self care video' &&
        !failed.has(v.id)
    );

    // 1. Bookmarks tab filter
    if (this.currentTab() === 'BOOKMARKS') {
      const bSet = this.bookmarkedIds();
      list = list.filter((v) => this.isBookmarked(v));
    }

    // 2. Category filter
    const cat = this.selectedCategory();
    if (cat && cat !== 'ALL') {
      list = list.filter((v) => (v.category || '').toLowerCase() === cat.toLowerCase());
    }

    // 3. Search query filter
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter((v) => {
        const title = (v.title || '').toLowerCase();
        const channel = (v.channel || '').toLowerCase();
        const desc = (v.description || '').toLowerCase();
        const category = (v.category || '').toLowerCase();
        return title.includes(q) || channel.includes(q) || desc.includes(q) || category.includes(q);
      });
    }

    return list;
  });

  // Track image load errors to fall back gracefully
  readonly failedImages = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadVideos();
    this.loadBookmarks();
  }

  loadVideos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.selfCareService.getVideos().subscribe({
      next: (videos) => {
        this.allVideos.set(videos || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('SelfCarePage error loading videos:', err);
        this.errorMessage.set('Unable to load self-care videos. Please check your connection.');
        this.isLoading.set(false);
      }
    });
  }

  loadBookmarks(): void {
    this.selfCareService.getBookmarkedIds().subscribe({
      next: (ids) => {
        this.bookmarkedIds.set(new Set(ids));
      },
      error: (err) => {
        console.error('Error loading bookmarks:', err);
      }
    });
  }

  setTab(tab: 'ALL' | 'BOOKMARKS'): void {
    this.currentTab.set(tab);
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  resetFilters(): void {
    this.selectedCategory.set('ALL');
    this.searchQuery.set('');
  }

  isBookmarked(video: SelfCareVideo | string): boolean {
    const id = typeof video === 'string' ? video : video.id;
    const vidId = typeof video === 'object' ? video.videoId : undefined;
    const url = typeof video === 'object' ? video.youtubeUrl : undefined;
    const set = this.bookmarkedIds();

    if (id && set.has(id)) return true;
    if (vidId && set.has(vidId)) return true;
    if (url && set.has(url)) return true;
    return false;
  }

  toggleBookmark(video: SelfCareVideo, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const id = video.id || video.videoId;
    const currentlyBookmarked = this.isBookmarked(video);
    const newSet = new Set(this.bookmarkedIds());

    if (currentlyBookmarked) {
      newSet.delete(video.id);
      if (video.videoId) newSet.delete(video.videoId);
      if (video.youtubeUrl) newSet.delete(video.youtubeUrl);
      this.bookmarkedIds.set(newSet);
      this.selfCareService.unbookmarkVideo(id).subscribe({ error: () => {} });
    } else {
      newSet.add(id);
      this.bookmarkedIds.set(newSet);
      this.selfCareService.bookmarkVideo(id).subscribe({ error: () => {} });
    }
  }

  openVideo(video: SelfCareVideo, event?: Event): void {
    if (event) {
      // Allow anchor clicks to behave natively
      const target = event.target as HTMLElement;
      if (target.closest('.bookmark-btn')) return;
    }
    window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer');
  }

  getThumbnail(video: SelfCareVideo): string {
    if (video.thumbnailUrl && !this.failedImages().has(video.id)) {
      return video.thumbnailUrl;
    }
    const vid = video.videoId;
    if (vid) {
      return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
    }
    return '';
  }

  handleImageError(video: SelfCareVideo): void {
    const newSet = new Set(this.failedImages());
    newSet.add(video.id);
    this.failedImages.set(newSet);
  }
}
