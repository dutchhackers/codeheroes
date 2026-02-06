import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { ProjectSummaryDto, ProjectDetailDto } from '@codeheroes/types';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  getProjects(): Observable<ProjectSummaryDto[]> {
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.#http.get<ProjectSummaryDto[]>(`${environment.apiUrl}/projects`, { headers });
      }),
    );
  }

  getProject(id: string): Observable<ProjectDetailDto> {
    return from(this.#auth.getIdToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.#http.get<ProjectDetailDto>(`${environment.apiUrl}/projects/${id}`, { headers });
      }),
    );
  }
}
