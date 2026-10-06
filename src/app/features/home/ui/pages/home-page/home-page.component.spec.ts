import { TestBed } from '@angular/core/testing';

import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  it('renders a single page heading', async () => {
    await TestBed.configureTestingModule({ imports: [HomePageComponent] }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('h1')).toHaveLength(1);
  });
});
