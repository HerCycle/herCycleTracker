import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { SelfCareService, SelfCareVideo } from './self-care.service';
import seedVideos from '../../../../scripts/seed-self-care-videos.json';

describe('SelfCareService & Validated Video Catalog', () => {
  let service: SelfCareService;

  const allSeedVideos: SelfCareVideo[] = seedVideos as SelfCareVideo[];
  const activeVideos: SelfCareVideo[] = allSeedVideos.filter(
    (v) =>
      v.active === true &&
      v.title &&
      v.title.trim() !== '' &&
      v.title.trim().toLowerCase() !== 'self care video'
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SelfCareService,
        { provide: Auth, useValue: { currentUser: null } },
        { provide: Firestore, useValue: {} }
      ]
    });
    service = TestBed.inject(SelfCareService);
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  describe('Cleaned Video Catalog Integrity (21 Valid Videos, 7 Deactivated)', () => {
    it('should have 28 total records in seed store, with exactly 21 active and 7 deactivated', () => {
      expect(allSeedVideos.length).toBe(28);
      expect(activeVideos.length).toBe(21);
      const inactive = allSeedVideos.filter((v) => v.active === false);
      expect(inactive.length).toBe(7);
    });

    it('should deactivate exactly the 7 unresolvable videos', () => {
      const expectedInactiveIds = [
        'video-08',
        'video-15',
        'video-18',
        'video-19',
        'video-20',
        'video-22',
        'video-26'
      ];
      const inactiveIds = allSeedVideos.filter((v) => v.active === false).map((v) => v.id);
      expect(inactiveIds.sort()).toEqual(expectedInactiveIds.sort());
    });

    it('should confirm ZERO active videos are titled "Self Care Video"', () => {
      const genericActive = activeVideos.filter(
        (v) => v.title.toLowerCase().trim() === 'self care video'
      );
      expect(genericActive.length).toBe(0);
    });

    it('should contain valid active counts per category: Exercise (11), Nutrition (5), Hygiene (5)', () => {
      const exercise = activeVideos.filter((v) => v.category === 'Exercise');
      const nutrition = activeVideos.filter((v) => v.category === 'Nutrition');
      const hygiene = activeVideos.filter((v) => v.category === 'Hygiene');

      expect(exercise.length).toBe(11);
      expect(nutrition.length).toBe(5);
      expect(hygiene.length).toBe(5);

      // Verify NO Meditation category exists
      const meditation = activeVideos.filter((v: any) => v.category === 'Meditation');
      expect(meditation.length).toBe(0);
    });

    it('should deduplicate link #6 (yB6DFubjzq0) from the Exercise category', () => {
      const duplicates = activeVideos.filter((v) => v.videoId === 'yB6DFubjzq0');
      expect(duplicates.length).toBe(1);
    });

    it('should preserve valid YouTube URLs for all 21 active videos', () => {
      activeVideos.forEach((v) => {
        expect(v.youtubeUrl).toBeTruthy();
        expect(
          v.youtubeUrl.startsWith('https://youtu.be/') ||
            v.youtubeUrl.startsWith('https://www.youtube.com/')
        ).toBeTrue();
        expect(v.thumbnailUrl).toBeTruthy();
        expect(v.active).toBeTrue();
        expect(v.title).toBeTruthy();
        expect(v.title).not.toBe('Self Care Video');
      });
    });
  });

  describe('Service Filtering & Search Logic', () => {
    it('should return all 21 active videos when category is ALL', (done) => {
      spyOn(service, 'getVideos').and.returnValue(of(activeVideos));

      service.getVideosByCategory('ALL').subscribe((videos) => {
        expect(videos.length).toBe(21);
        done();
      });
    });

    it('should filter correctly by Exercise category (11 active videos)', (done) => {
      spyOn(service, 'getVideos').and.returnValue(of(activeVideos));

      service.getVideosByCategory('Exercise').subscribe((videos) => {
        expect(videos.length).toBe(11);
        expect(videos.every((v) => v.category === 'Exercise')).toBeTrue();
        done();
      });
    });

    it('should filter correctly by Nutrition category (5 active videos)', (done) => {
      spyOn(service, 'getVideos').and.returnValue(of(activeVideos));

      service.getVideosByCategory('Nutrition').subscribe((videos) => {
        expect(videos.length).toBe(5);
        expect(videos.every((v) => v.category === 'Nutrition')).toBeTrue();
        done();
      });
    });

    it('should filter correctly by Hygiene category (5 active videos)', (done) => {
      spyOn(service, 'getVideos').and.returnValue(of(activeVideos));

      service.getVideosByCategory('Hygiene').subscribe((videos) => {
        expect(videos.length).toBe(5);
        expect(videos.every((v) => v.category === 'Hygiene')).toBeTrue();
        done();
      });
    });

    it('should search across title, channel, description, and category', (done) => {
      spyOn(service, 'getVideos').and.returnValue(of(activeVideos));

      service.searchVideos('yoga').subscribe((videos) => {
        expect(videos.length).toBeGreaterThan(0);
        videos.forEach((v) => {
          const match =
            (v.title || '').toLowerCase().includes('yoga') ||
            (v.channel || '').toLowerCase().includes('yoga') ||
            (v.description || '').toLowerCase().includes('yoga') ||
            (v.category || '').toLowerCase().includes('yoga');
          expect(match).toBeTrue();
        });
        done();
      });
    });
  });
});
