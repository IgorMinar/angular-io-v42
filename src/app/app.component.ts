import { Component, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/mergeMap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  documentId: Observable<string>;

  private urlParser = document.createElement('a');
  private ownLocationChanges = new Subject<string>();


  constructor(private location: Location) {
    // TODO(i): location should not strip trailing slashes as they are significant.
    //    Unlike Router, low level api like Location should not have opinions like this.
    Location.stripTrailingSlash = (v) => v;

    this.documentId = Observable.merge<string>(
        // TODO(i): it's odd that Location isn't a hot observable => change to hot?
        Observable.of(location.path()),
        // TODO(i): since location doesn't expose the internal observable it's hard to use it => expose?
        (location as any)._subject.map(event => event.url),
        // TODO(i): we should make it possible to be notified of all Location changes, including our own
        //    https://github.com/angular/angular/issues/12691
        this.ownLocationChanges
    ).map(locationUrl => {
      console.log(`Location url: "${locationUrl}"`);
      return locationUrl === '' ? '/' : locationUrl;
    });
  }


  @HostListener('click', ['$event.target', '$event.button', '$event.ctrlKey', '$event.metaKey'])
  onClick(eventTarget: HTMLElement, button: number, ctrlKey: boolean, metaKey: boolean): boolean {
    if (button !== 0 || ctrlKey || metaKey) {
      return true;
    }

    // intercept clicks only on HTML Anchors
    if (!(eventTarget instanceof HTMLAnchorElement)) return true;

    const anchorTarget = eventTarget.target;

    // honor bailout via <a href="..." target="..."
    if (anchorTarget && anchorTarget !== '_self') return true;

    this.urlParser.href = eventTarget.href;
    const {pathname, search, hash} = this.urlParser;
    const relativeUrl = pathname + (search ? '?' + search : '') + (hash ? '#' + hash : '');

    // TODO(i): ignore clicks on links to other origins
    // TODO(i): we should add pushState to Location otherwise it's not possible to control window.title
    this.location.go(relativeUrl);
    this.ownLocationChanges.next(relativeUrl);

    return false;
  }
}
