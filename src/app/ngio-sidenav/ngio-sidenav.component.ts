import { Component } from '@angular/core';
import { DocInfoService, NgLang } from '../doc-info.service';

export interface ItemInfo {
  title: string,
  navTitle?: string, // if navTitle is present, use it for the sidenav, otherwise use title.
  href: string,
  tooltip?: string,
  basics?: boolean, // if basics is set to true, then it's a page in Developer Guide, if false it's Adv. Documentation.
  hide?: boolean, // if true hide entry from sidenav
  isSelected?: boolean,
};

// TODO: replace hard coded `latest` by dynamic version.
@Component({
  selector: 'ngio-sidenav',
  templateUrl: './ngio-sidenav.component.html'
})
export class NgioSidenavComponent {
  isLangMenuOpen = false;
  isMobileMenuOpen: boolean = false;
  mobileBreakpoint = 768;

  // IMPORTANT NOTE: this is the original implementation from the
  // Halloween edition. It still uses require(...) for now; will
  // update later.
  ngLangDataMap: { ts: any, dart?: any, js?: any } = {
    ts: require('../../assets/sidenav/ts/latest/_data.json'),
    js: require('../../assets/sidenav/js/latest/_data.json'),
    dart: require('../../assets/sidenav/dart/latest/_data.json'),
  };

  chapters: any = {
    ts: {
      cookbook: require('../../assets/sidenav/ts/latest/cookbook/_data.json'),
      guide: require('../../assets/sidenav/ts/latest/guide/_data.json'),
      tutorial: require('../../assets/sidenav/ts/latest/tutorial/_data.json')
    },
    js: {
      cookbook: require('../../assets/sidenav/js/latest/cookbook/_data.json'),
      guide: require('../../assets/sidenav/js/latest/guide/_data.json'),
      tutorial: require('../../assets/sidenav/js/latest/tutorial/_data.json')
    },
    dart: {
      cookbook: require('../../assets/sidenav/dart/latest/cookbook/_data.json'),
      guide: require('../../assets/sidenav/dart/latest/guide/_data.json'),
      tutorial: require('../../assets/sidenav/dart/latest/tutorial/_data.json')
    }
  };

  sidenavEntries = {
    tutorial: [],
    cookbook: [],
    guide: [],
    advanced: []
  };

  constructor(
    private docInfoSvc: DocInfoService,
    // private router: Router
  ) {
    // this.router.events.subscribe(event => {
    //   if (event instanceof NavigationEnd) {
    this.sidenavEntries.tutorial =
      this.toEntries(this.chapters[this.ngLang].tutorial).filter(e => !e.hide);

    this.sidenavEntries.cookbook =
      this.toEntries(this.chapters[this.ngLang].cookbook).filter(e => !e.hide);

    this.sidenavEntries.guide =
      this.toEntries(this.chapters[this.ngLang].guide).filter(e => e.basics && !e.hide);

    this.sidenavEntries.advanced =
      this.toEntries(this.chapters[this.ngLang].guide).filter(e => !e.basics && !e.hide);
    //   }
    // });
  }

  get ngLang(): NgLang { return this.docInfoSvc.ngLang || this.docInfoSvc.defaultNgLang; }

  get vers(): string { return this.docInfoSvc.vers || this.docInfoSvc.defaultVers; }

  get pageRoute(): string { return this.docInfoSvc.pageRoute; }

  toggleLangMenu() {
    this.isLangMenuOpen = !this.isLangMenuOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  onResize(event) {
    const w = event.target.innerWidth;
    if (w >= this.mobileBreakpoint) {
      this.isMobileMenuOpen = false; // hide mobile menu when resized
    }
  }

  redirectToMatchingDocLang(lang: string) {
    let currentPageUrl = this.docInfoSvc.path;
    currentPageUrl = currentPageUrl.replace(/\/api.*/, '/api'); // strip api entry name from redirect
    currentPageUrl = currentPageUrl.replace(/#.*/, ''); // strip anchors from redirects
    return currentPageUrl.replace(/\/(dart|ts|js)(\/|$)/, `/${lang}\$2`);
  }

  dropdownItemText(lang: string) {
    return `Angular for ${this.docInfoSvc.ngLangToName(lang)}`;
  }

  isMenuHidden(r: string): boolean {
    return !this.docInfoSvc.path.includes(r); // !this.router.url.includes(r);
  }

  get ngLangData() { return this.ngLangDataMap[this.ngLang]; }

  /** Sidenav top-level item info */
  chapter(name: string): ItemInfo {
    let item = this.ngLangData[name] || {};

    const advancedFirstPage = this.ngLang === 'ts' ? 'ngmodule' : 'attribute-directives';
    const itemUri = (name === 'index') ? ''
      : name.match(/^(api|cookbook|guide|tutorial)\/?$/) ? name
        : name === 'advanced' ? `guide/${advancedFirstPage}.html`
          : `${name}.html`;

    // special case where the advanced chapter entry is the same uri as the first item of advanced
    if (name === 'advanced' && this.sidenavEntries.advanced[0]) {
      item = this.sidenavEntries.advanced[0];
    }
    const href = `/docs/${this.ngLang}/${this.vers}/${itemUri}`;
    return {
      title: item.menuTitle || item.title,
      href: href,
      tooltip: this.tooltip(item),
      isSelected: this.docInfoSvc.path.startsWith(href),
    };
  }

  /** True iff the router is visiting a docs guide (but not advanced) page. */
  IS_GUIDE_SELECTED(): boolean { return this.guidePage() !== null; }

  IS_ADVANCED_DOCUMENTATION_SELECTED(): boolean {
    return this.pageRoute && this.pageRoute.startsWith('guide') && !this.guidePage();
  }

  /**
   * Returns the guide (not advanced) page URL corresponding to this Location, null otherwise.
   * Note that 'guide' or 'guide/' is returned as 'index'.
   */
  private guidePage(): string | null {
    if (!this.pageRoute) return null;
    const matches = this.pageRoute.match(/guide\/?$|guide\/([-\w]+)[\._]html(#.*)?$/);
    if (!matches) return null;
    const page = matches[1];

    return !page ? 'index'
      : this.sidenavEntries.guide.find(p => p.href === page) ? page : null;
  }

  private tooltip(pageDataTime: { description?, intro?, banner?, title?}) {
    return pageDataTime.description || pageDataTime.intro || pageDataTime.banner || pageDataTime.title || ''
  }

  private toEntries(dict): Array<ItemInfo> {
    let items = [];
    const keys = Object.keys(dict);
    keys.forEach((k) => {
      const obj = dict[k];
      items.push({ title: obj.navTitle || obj.title, href: k, tooltip: obj.intro, basics: !!obj.basics, hide: !!obj.hide });
    });
    return items;
  }
}