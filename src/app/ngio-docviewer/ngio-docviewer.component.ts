import { Component, ComponentRef, ComponentFactory, ComponentFactoryResolver, DoCheck, Input, Injector, OnDestroy, ElementRef } from '@angular/core'
import { Http } from '@angular/http'
import { NgioCodeExampleComponent} from '../ngio-code-example/ngio-code-example.component';

const EMBEDDED_COMPONENTS = [NgioCodeExampleComponent/*NgioHeader, LiveExample, CodeTabsComponent*/];
const initialDocViewerElement = document.querySelector('ngio-docviewer');
const initialDocViewerContent = initialDocViewerElement ? initialDocViewerElement.innerHTML : '';

@Component({
  selector: 'ngio-docviewer',
  template: '',
  styleUrls: ['./ngio-docviewer.component.css'],
  entryComponents: EMBEDDED_COMPONENTS
})
export class NgioDocviewerComponent implements DoCheck, OnDestroy {

  private activeEmbeddedComponents: ComponentRef<any>[] = [];
  private embeddedComponentFactories: Map<string, ComponentFactory<any>> = new Map();
  private hostElement: HTMLElement;


  constructor(componentFactoryResolver: ComponentFactoryResolver,
              private http: Http,
              private hostElementRef: ElementRef,
              private injector: Injector) {

    this.hostElement = hostElementRef.nativeElement;
    // Security: the initialDocViewerContent comes from the prerendered DOM as is considered to be secure
    this.hostElement.innerHTML = initialDocViewerContent;

    for (let component of EMBEDDED_COMPONENTS) {
      const factory = componentFactoryResolver.resolveComponentFactory(component);
      const selector = factory.selector;
      this.embeddedComponentFactories.set(selector, factory);
    }
  }


  // TODO(i): convert to passing in the observable so that we can cancel http requests
  @Input() set documentId(documentId) {
    const documentUrl = `assets/documents${documentId}${documentId.endsWith('/') ? 'index' : ''}.html`;
    console.log(`Fetching document: ${documentId} from ${documentUrl}`);

    this.http.get(documentUrl).subscribe(
        (response) => {
          this.ngOnDestroy();
          // security: the response contains html source that is always authored by the documentation
          //   team and is considered to be safe
          this.hostElement.innerHTML = response.text();

          // TODO(i): why can't I use for-of? why doesn't typescript like Map#value() iterators?
          this.embeddedComponentFactories.forEach(factory => {
            const selector = factory.selector;
            const embeddedComponentElements = this.hostElement.querySelectorAll(selector);
            const contentPropertyName = selectorToContentPropertyName(selector);

            // cast due to https://github.com/Microsoft/TypeScript/issues/4947
            for (let element of embeddedComponentElements as any as HTMLElement[]){
              // hack: preserve the current element content because the factory will empty it out
              // security: the source of this innerHTML is always authored by the documentation team
              //   and is considered to be safe
              element[contentPropertyName] = element.innerHTML;
              const componentFactory = this.embeddedComponentFactories.get(selector);
              const embeddedComponent = componentFactory.create(this.injector, [], element);
              this.activeEmbeddedComponents.push(embeddedComponent);
            }
          });
        },
        (error) => {
          this.ngOnDestroy();
          this.hostElement.innerHTML = `Error fetching document: ${documentId}<br><hr><br>${error}`;
        }
    );
  }


  ngDoCheck() {
    this.activeEmbeddedComponents.forEach(comp => comp.changeDetectorRef.detectChanges());
  }


  ngOnDestroy() {
    // destroy components otherwise there will be memory leaks
    this.activeEmbeddedComponents.forEach(comp => comp.destroy());
    this.activeEmbeddedComponents.length = 0;
  }
}


/**
 * Compute the component content property name by converting the selector to camelCase and appending
 * 'Content', e.g. live-example => liveExampleContent
 */
function selectorToContentPropertyName(selector: string) {
  return selector.replace(/-(.)/g, (match, $1) => $1.toUpperCase()) + 'Content';
}