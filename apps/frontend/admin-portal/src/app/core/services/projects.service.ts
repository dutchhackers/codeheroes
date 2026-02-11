import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { CreateProjectDto, ProjectSummaryDto, ProjectDetailDto, UpdateProjectDto } from '@codeheroes/types';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  getProjects(): Observable<ProjectSummaryDto[]> {
    return this.#withAuth((headers) =>
      this.#http.get<ProjectSummaryDto[]>(`${environment.apiUrl}/projects`, { headers }),
    );
  }

  createProject(data: CreateProjectDto): Observable<ProjectDetailDto> {
    return this.#withAuth((headers) =>
      this.#http.post<ProjectDetailDto>(`${environment.apiUrl}/projects`, data, { headers }),
    );
  }

  getProject(id: string): Observable<ProjectDetailDto> {
    return this.#withAuth((headers) =>
      this.#http.get<ProjectDetailDto>(`${environment.apiUrl}/projects/${id}`, { headers }),
    );
  }

  updateProject(id: string, data: UpdateProjectDto): Observable<ProjectDetailDto> {
    return this.#withAuth((headers) =>
      this.#http.put<ProjectDetailDto>(`${environment.apiUrl}/projects/${id}`, data, { headers }),
    );
  }

  #withAuth<T>(fn: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        if (!token) throw new Error('Not authenticated');
        return fn(new HttpHeaders().set('Authorization', `Bearer ${token}`));
      }),
    );
  }
}
