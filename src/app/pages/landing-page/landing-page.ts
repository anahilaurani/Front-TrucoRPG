import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [ RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage  implements AfterViewInit {
ngAfterViewInit(): void {

    const secciones = document.querySelectorAll('.seccion-fade');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {

          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }

        });
      },
      {
        threshold: 0.2
      }
    );

    secciones.forEach(seccion => observer.observe(seccion));
  }
}
