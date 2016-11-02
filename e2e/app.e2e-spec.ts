import { AngularIoV42Page } from './app.po';

describe('angular-io-v42 App', function() {
  let page: AngularIoV42Page;

  beforeEach(() => {
    page = new AngularIoV42Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
