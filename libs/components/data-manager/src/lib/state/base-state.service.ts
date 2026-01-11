import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

@Injectable()
export abstract class BaseStateService implements OnDestroy {
  protected ngUnsubscribe = new Subject<void>();

  public ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  protected createBehaviorSubject<T>(initialValue: T): BehaviorSubject<T> {
    return new BehaviorSubject<T>(initialValue);
  }

  protected createReplaySubject<T>(bufferSize = 1): ReplaySubject<T> {
    return new ReplaySubject<T>(bufferSize);
  }
}
