import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../services/api.service';
import { AppService } from '../services/app.service';

@Injectable()
export class RoomGuard implements CanActivate {

  constructor(private api: ApiService, private app: AppService, private router: Router) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.api.joinRoom(next.params.token)
    .catch( err => {
      this.app.onError.next(`The lobby you try to access seems to be unavailable. 
      You have been redirected to the homepage.`);
      this.router.navigate(['']);
      return false;
    });
  }
}
