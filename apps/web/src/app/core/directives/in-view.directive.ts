import type { OnDestroy, OnInit } from '@angular/core';
import { Directive, ElementRef, inject, input, output, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

@Directive({
  standalone: true,
  selector: '[appInView]',
})
export class InViewDirective implements OnInit, OnDestroy {
  #observer!: IntersectionObserver;
  #intersectionSubject = signal<IntersectionObserverEntry[]>([]);
  #el = inject(ElementRef);

  public rootMargin = input<string>('0px');
  public threshold = input<number>(0.1);

  public inView = output<boolean>();

  constructor() {
    toObservable(this.#intersectionSubject)
      .pipe(debounceTime(200))
      .subscribe((entries) => {
        entries.forEach((entry) => {
          this.inView.emit(entry.isIntersecting || entry.boundingClientRect.top < 0);
        });
      });
  }

  public ngOnInit(): void {
    this.#initObserver();
  }

  public ngOnDestroy(): void {
    this.#observer.disconnect();
  }

  #initObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: this.rootMargin(),
      threshold: this.threshold(),
    };

    this.#observer = new IntersectionObserver((entries) => {
      this.#intersectionSubject.set(entries);
    }, options);

    this.#observer.observe(this.#el.nativeElement);
  }
}
