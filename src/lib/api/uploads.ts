import type { Observable } from 'rxjs';
import { apiRequest$ } from './client';
import type { UploadResult } from './types';

// The one multipart endpoint in the API. Returns a hosted Cloudinary URL to
// drop into a `heroImageUrl`/`avatarUrl` field.
//
// Two error codes worth handling at the call site:
//   400 -- the file isn't an image
//   503 -- Cloudinary isn't configured on the server
//
// Role caveat (integration guide §10.1): this requires OPERATOR or ADMIN.
// A TOURIST gets a 403, so profile avatars can't be uploaded here -- they
// need an externally hosted URL until the backend opens the endpoint up.
export function uploadImage$(file: File): Observable<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest$<UploadResult>('/uploads/image', { method: 'POST', body: form });
}
