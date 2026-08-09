import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { Observable } from 'rxjs';

export interface Video {
  id: number;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  youtubeUrl: string;
  createdAt?: string;
  isBookmarked?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SelfCareService {
  private readonly api = inject(ApiService);

  getVideos(): Observable<ApiResponse<Video[]>> {
    return this.api.get<Video[]>('/api/self-care');
  }

  getVideosByCategory(category: string): Observable<ApiResponse<Video[]>> {
    return this.api.get<Video[]>(`/api/self-care/category/${category}`);
  }

  searchVideos(query: string): Observable<ApiResponse<Video[]>> {
    return this.api.get<Video[]>(`/api/self-care/search?query=${query}`);
  }

  getBookmarks(): Observable<ApiResponse<Video[]>> {
    return this.api.get<Video[]>('/api/self-care/bookmarks');
  }

  bookmarkVideo(videoId: number): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/api/self-care/bookmark/${videoId}`, {});
  }

  unbookmarkVideo(videoId: number): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/api/self-care/bookmark/${videoId}`);
  }
}
