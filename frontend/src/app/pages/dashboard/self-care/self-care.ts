import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SelfCareService, Video } from '../../../services/self-care.service';

const DEFAULT_VIDEOS: Video[] = [
  // --- NUTRITION SECTION ---
  {
    id: 1,
    title: 'Nutrition & Diet Guide for Period & PCOS Management',
    description: 'Essential dietary and nutrition guidance on foods to eat for period cramps, PCOS, and cycle health.',
    category: 'NUTRITION',
    thumbnail: 'https://img.youtube.com/vi/1SD_29gnFu0/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=1SD_29gnFu0'
  },
  {
    id: 2,
    title: 'Healthy Eating During Menstrual Cycle',
    description: 'Foods to boost iron, reduce bloating, and regulate hormones during period phases.',
    category: 'NUTRITION',
    thumbnail: 'https://img.youtube.com/vi/caBhbgF2kHs/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=caBhbgF2kHs'
  },
  {
    id: 3,
    title: 'PCOS Diet & Nutrition Strategies',
    description: 'Nutritional advice for managing insulin resistance and menstrual health.',
    category: 'NUTRITION',
    thumbnail: 'https://img.youtube.com/vi/YdAb7FYUW5A/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=YdAb7FYUW5A'
  },
  {
    id: 4,
    title: 'Best Foods for Menstrual Cramps',
    description: 'Natural foods and vitamins that help soothe severe period cramp pain.',
    category: 'NUTRITION',
    thumbnail: 'https://img.youtube.com/vi/r5FlXjSOJAA/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=r5FlXjSOJAA'
  },
  {
    id: 5,
    title: 'Cycle Syncing Nutrition & Meal Plan',
    description: 'How to adapt your diet to follicular, ovulation, luteal, and menstrual phases.',
    category: 'NUTRITION',
    thumbnail: 'https://img.youtube.com/vi/vU5f1OAisWM/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=vU5f1OAisWM'
  },
  {
    id: 6,
    title: 'Essential Vitamins & Minerals for Women',
    description: 'Key nutrients every woman needs for menstrual regularity and vitality.',
    category: 'NUTRITION',
    thumbnail: 'https://img.youtube.com/vi/79uXzgtMGsM/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=79uXzgtMGsM'
  },

  // --- EXERCISE SECTION ---
  {
    id: 7,
    title: '10-Min Yoga Routine for Period Cramps & Pain',
    description: 'Gentle yoga stretches to relieve lower back pain and cramping fast.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/L1bfUZIT1Tc/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=L1bfUZIT1Tc'
  },
  {
    id: 8,
    title: 'Gentle Period Stretch & Deep Relaxation',
    description: 'Easy stretching session designed specifically for heavy flow days.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/uPaOjOeZQ3w/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=uPaOjOeZQ3w'
  },
  {
    id: 9,
    title: 'Relieve Period Cramps & PMS Movement Flow',
    description: 'Soothing movement flow to boost circulation and relieve PMS fatigue.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/7sVuwRn9yUw/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=7sVuwRn9yUw'
  },
  {
    id: 10,
    title: 'Soothing Pelvic Stretches for Women\'s Wellness',
    description: 'Targeted pelvic floor and hip opening stretches to alleviate tension.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/zRWUrWPWD2Y/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=zRWUrWPWD2Y'
  },
  {
    id: 11,
    title: 'Restorative Movement & Period Relief Routine',
    description: 'Calming restorative poses to soothe abdominal discomfort.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/GKkha0fvIXk/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=GKkha0fvIXk'
  },
  {
    id: 12,
    title: 'Period Cramps Relief Yoga Sequence',
    description: 'Restorative yoga sequence for period pain and cycle comfort.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/rDpzP6wQOEs/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=rDpzP6wQOEs'
  },
  {
    id: 13,
    title: 'Gentle Yoga Routine for Period Pain',
    description: 'Soothe cramps and lower back ache with restorative period yoga.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/S4UfZ2TV_uA/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=S4UfZ2TV_uA'
  },
  {
    id: 14,
    title: 'Low Impact Exercise for Bleeding Phase',
    description: 'Gentle movement and stretching to boost energy during your period.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/4JaCcp39iVI/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=4JaCcp39iVI'
  },
  {
    id: 15,
    title: 'Pelvic Floor & Core Relief Exercises',
    description: 'Targeted pelvic exercises to ease abdominal tension and cramping.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/evQcsWf54qY/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=evQcsWf54qY'
  },
  {
    id: 16,
    title: 'Full Body Stretches for PMS & Fatigue',
    description: 'Relaxing full body stretch routine for pre-menstrual syndrome relief.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/ptC6gK3QbLg/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=ptC6gK3QbLg'
  },
  {
    id: 17,
    title: 'Yoga & Breathing for Hormonal Balance',
    description: 'Calming yoga flows designed for stress reduction and cycle wellness.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/pubczv0pOrc/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=pubczv0pOrc'
  },
  {
    id: 18,
    title: 'Luteal Phase Exercise & Movement Guide',
    description: 'Adjusting workout intensity to match your energy during the luteal phase.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/jBnf12rYBKg/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=jBnf12rYBKg'
  },
  {
    id: 19,
    title: 'Quick 10-Min Relief Workout for Cramps',
    description: 'Fast, effective movements to ease menstrual discomfort anytime.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/VaVIvmQx_Xw/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=VaVIvmQx_Xw'
  },
  {
    id: 20,
    title: 'Bedtime Stretches for Period Comfort',
    description: 'Soothing nighttime stretches for better sleep during heavy period days.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/-nFUNjxhGMs/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=-nFUNjxhGMs'
  },
  {
    id: 21,
    title: 'Gentle Pilates for Women\'s Health',
    description: 'Low-intensity Pilates routine for core strength and pelvic wellness.',
    category: 'EXERCISE',
    thumbnail: 'https://img.youtube.com/vi/5JvbjrLESPs/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=5JvbjrLESPs'
  },

  // --- HYGIENE SECTION ---
  {
    id: 22,
    title: 'Essential Period & Intimate Hygiene Guide',
    description: 'Key practices for personal cleanliness, intimate care, and hygiene during periods.',
    category: 'HYGIENE',
    thumbnail: 'https://img.youtube.com/vi/EcqtztE4QrY/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=EcqtztE4QrY'
  },
  {
    id: 23,
    title: 'How to Choose & Care for Sanitary Napkins',
    description: 'Proper usage, changing frequency, and disposal techniques for menstrual pads.',
    category: 'HYGIENE',
    thumbnail: 'https://img.youtube.com/vi/ZLAbQHcANhc/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=ZLAbQHcANhc'
  },
  {
    id: 24,
    title: 'Menstrual Cup Usage & Sterilization',
    description: 'Step-by-step guide on inserting, removing, and sterilizing menstrual cups safely.',
    category: 'HYGIENE',
    thumbnail: 'https://img.youtube.com/vi/W-CGhmKHWb0/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=W-CGhmKHWb0'
  },
  {
    id: 25,
    title: 'Preventing Infections & Vaginal Health',
    description: 'Tips to maintain natural pH balance and prevent fungal or bacterial infections.',
    category: 'HYGIENE',
    thumbnail: 'https://img.youtube.com/vi/qFLElwY-SYE/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=qFLElwY-SYE'
  },
  {
    id: 26,
    title: 'Daily Hygiene Habits During Menstruation',
    description: 'Best daily routines, shower tips, and undergarment care during your flow.',
    category: 'HYGIENE',
    thumbnail: 'https://img.youtube.com/vi/kd_gR_S-rGw/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=kd_gR_S-rGw'
  },
  {
    id: 27,
    title: 'Intimate Care & Period Wellness Guide',
    description: 'Maintaining pH balance and cleanliness during menstrual flow.',
    category: 'HYGIENE',
    thumbnail: 'https://img.youtube.com/vi/1SD_29gnFu0/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=1SD_29gnFu0'
  },

  // --- MEDITATION SECTION ---
  {
    id: 28,
    title: 'Guided Meditation for Severe Cramps & Pain Relief',
    description: 'Calming mental visualization and deep breathing to release physical tension.',
    category: 'MEDITATION',
    thumbnail: 'https://img.youtube.com/vi/sxRXiEDHtRU/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=sxRXiEDHtRU'
  },
  {
    id: 29,
    title: 'Mindfulness & Mood Swing Relaxation',
    description: 'Soothe PMS anxiety, irritability, and emotional fatigue with guided meditation.',
    category: 'MEDITATION',
    thumbnail: 'https://img.youtube.com/vi/HGwKWWon3B8/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=HGwKWWon3B8'
  },
  {
    id: 30,
    title: '1-Min Quick Breathing Exercise for Period Relief',
    description: 'Quick calming breathwork technique to ease immediate menstrual pain.',
    category: 'MEDITATION',
    thumbnail: 'https://img.youtube.com/vi/izgdK2NLc1c/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/izgdK2NLc1c'
  },
  {
    id: 31,
    title: '10-Minute Guided Period Meditation',
    description: 'Soothe cramps, mood swings, and anxiety with this simple mindfulness breath meditation.',
    category: 'MEDITATION',
    thumbnail: 'https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM'
  }
];

@Component({
  selector: 'app-self-care',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './self-care.html',
  styleUrl: './self-care.scss'
})
export class SelfCarePage implements OnInit {
  private readonly selfCareService = inject(SelfCareService);
  private readonly sanitizer = inject(DomSanitizer);

  // Tab state: 'ALL' | 'BOOKMARKS'
  readonly currentTab = signal<'ALL' | 'BOOKMARKS'>('ALL');

  readonly videos = signal<Video[]>([]);
  readonly bookmarks = signal<Video[]>([]);
  readonly searchInput = signal('');
  readonly selectedCategory = signal('');

  // Playing video state
  readonly playingVideo = signal<Video | null>(null);
  readonly safeEmbedUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this.loadBookmarks();
    this.loadVideos();
  }

  loadVideos(): void {
    const q = this.searchInput().toLowerCase();
    const cat = this.selectedCategory();

    let obs;
    if (q) {
      obs = this.selfCareService.searchVideos(q);
    } else if (cat) {
      obs = this.selfCareService.getVideosByCategory(cat);
    } else {
      obs = this.selfCareService.getVideos();
    }

    obs.subscribe({
      next: (res) => {
        const fetched: Video[] = (res.success && res.data) ? res.data : [];
        const cleanFetched = fetched.filter(v => 
          v.title && 
          !v.title.toLowerCase().includes('gentle yoga for period cramps') &&
          (!v.thumbnail || !v.thumbnail.includes('example.com'))
        );

        const combined = [...cleanFetched];
        for (const def of DEFAULT_VIDEOS) {
          const exists = combined.some(v => 
            (v.youtubeUrl && def.youtubeUrl && v.youtubeUrl === def.youtubeUrl) ||
            (v.title && def.title && v.title.toLowerCase() === def.title.toLowerCase())
          );
          if (!exists) {
            combined.push(def);
          }
        }

        let filtered = combined.filter(v => 
          v.title && !v.title.toLowerCase().includes('gentle yoga for period cramps')
        );
        if (cat) {
          filtered = filtered.filter(v => v.category && v.category.toUpperCase() === cat.toUpperCase());
        }
        if (q) {
          filtered = filtered.filter(v => 
            (v.title && v.title.toLowerCase().includes(q)) || 
            (v.description && v.description.toLowerCase().includes(q))
          );
        }
        this.videos.set(filtered);
      },
      error: () => {
        let filtered = DEFAULT_VIDEOS.filter(v => 
          v.title && !v.title.toLowerCase().includes('gentle yoga for period cramps')
        );
        if (cat) {
          filtered = filtered.filter(v => v.category && v.category.toUpperCase() === cat.toUpperCase());
        }
        if (q) {
          filtered = filtered.filter(v => 
            (v.title && v.title.toLowerCase().includes(q)) || 
            (v.description && v.description.toLowerCase().includes(q))
          );
        }
        this.videos.set(filtered);
      }
    });
  }

  loadBookmarks(): void {
    // 1. Load from localStorage for instant offline & persisted bookmarks
    let localBookmarks: Video[] = [];
    try {
      const stored = localStorage.getItem('hc_selfcare_bookmarks');
      if (stored) {
        localBookmarks = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse local bookmarks', e);
    }

    if (localBookmarks.length > 0) {
      this.bookmarks.set(localBookmarks);
    }

    // 2. Fetch from backend API and merge
    this.selfCareService.getBookmarks().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const merged = [...res.data];
          for (const loc of localBookmarks) {
            const exists = merged.some(b => 
              (b.id && loc.id && b.id === loc.id) ||
              (b.youtubeUrl && loc.youtubeUrl && b.youtubeUrl === loc.youtubeUrl)
            );
            if (!exists) {
              merged.push(loc);
            }
          }
          this.bookmarks.set(merged);
          try {
            localStorage.setItem('hc_selfcare_bookmarks', JSON.stringify(merged));
          } catch (e) {
            console.warn('Could not save merged bookmarks', e);
          }
        }
      }
    });
  }

  search(): void {
    this.selectedCategory.set('');
    this.loadVideos();
  }

  clearSearch(): void {
    this.searchInput.set('');
    this.loadVideos();
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.searchInput.set('');
    this.loadVideos();
  }

  toggleBookmark(video: Video, event: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const currentlyBookmarked = this.isBookmarked(video);

    if (currentlyBookmarked) {
      // Remove video from bookmarks signal
      this.bookmarks.update(list => list.filter(b => 
        !(
          (b.id && video.id && b.id === video.id) ||
          (b.youtubeUrl && video.youtubeUrl && b.youtubeUrl === video.youtubeUrl) ||
          (b.title && video.title && b.title.toLowerCase() === video.title.toLowerCase())
        )
      ));
      this.selfCareService.unbookmarkVideo(video.id).subscribe({ error: () => {} });
    } else {
      // Add video to bookmarks signal
      const newBookmark: Video = { ...video, isBookmarked: true };
      this.bookmarks.update(list => [...list, newBookmark]);
      this.selfCareService.bookmarkVideo(video.id).subscribe({ error: () => {} });
    }

    // Persist immediately in localStorage
    try {
      localStorage.setItem('hc_selfcare_bookmarks', JSON.stringify(this.bookmarks()));
    } catch (e) {
      console.warn('Could not save bookmarks to localStorage', e);
    }
  }

  isBookmarked(video: Video | number): boolean {
    const vidId = typeof video === 'number' ? video : video.id;
    const youtubeUrl = typeof video === 'object' ? video.youtubeUrl : null;
    const title = typeof video === 'object' ? video.title?.toLowerCase() : null;

    return this.bookmarks().some(b => 
      (b.id && vidId && b.id === vidId) ||
      (b.youtubeUrl && youtubeUrl && b.youtubeUrl === youtubeUrl) ||
      (b.title && title && b.title.toLowerCase() === title)
    );
  }

  playVideo(video: Video): void {
    this.playingVideo.set(video);
    
    // Parse YouTube URL to embed format
    let videoId = '';
    const url = video.youtubeUrl || '';
    
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('shorts/')) {
      videoId = url.split('shorts/')[1]?.split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    } else {
      videoId = url;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    this.safeEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
  }

  closeVideoPlayer(): void {
    this.playingVideo.set(null);
    this.safeEmbedUrl.set(null);
  }

  getThumbnail(vid: Video): string {
    if (vid.thumbnail && !vid.thumbnail.includes('example.com')) {
      return vid.thumbnail;
    }
    const url = vid.youtubeUrl || '';
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('shorts/')) {
      videoId = url.split('shorts/')[1]?.split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400';
  }

  handleImageError(event: Event, vid: Video): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      const url = vid.youtubeUrl || '';
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('shorts/')) {
        videoId = url.split('shorts/')[1]?.split('?')[0];
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
      }
      if (videoId && !target.src.includes('img.youtube.com')) {
        target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      } else {
        target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400';
      }
    }
  }
}

