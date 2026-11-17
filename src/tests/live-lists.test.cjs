const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '../webparts/innovationPulse');
const cache = new Map();
// Load the actual source with no SharePoint modules or network APIs available.
function load(filename) {
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} };
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2015 } }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports, URL, Error, Set,
    window: { setTimeout: callback => { callback(); return 0; } },
    require(name) {
      if (name === 'react') return React;
      if (name === '@microsoft/sp-http') return { SPHttpClient: { configurations: { v1: {} } } };
      // Portal/focus/animation behavior is exercised in the browser checks.
      if (name === './ArticleDialog') return { ArticleDialog: props => React.createElement('section', {}, props.children) };
      if (name.endsWith('.jpg')) {
        const asset = path.resolve(path.dirname(filename), name);
        assert.ok(fs.statSync(asset).size > 10000, 'Banner asset must exist: ' + name);
        return name;
      }
      if (name.endsWith('.scss')) return { default: {} };
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name + '.ts'));
      throw new Error('Unexpected external dependency: ' + name);
    }
  }, { filename });
  cache.set(filename, module.exports);
  return module.exports;
}
const { SharePointListsService } = load(path.join(root, 'services/SharePointListsService.ts'));
const { newsFields, viewFields } = load(path.join(root, 'services/listSchema.ts'));
const { categoryBanners, bannerForCategory, defaultBanner } = load(path.join(root, 'presentation/categoryBanners.ts'));
const Component = load(path.join(root, 'components/InnovationPulse.tsx')).default;
const site = 'https://tenant.example/sites/innovation';
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => value });
const types = key => /date/i.test(key) || key === 'ViewedAt' ? 'DateTime' : key === 'InDib' ? 'Boolean' : key === 'ArticleId' ? 'Number' : /url/i.test(key) ? 'URL' : 'Text';
const schema = names => Object.entries(names).map(([key, name]) => ({ Title: name, InternalName: key, TypeAsString: types(key) }));
const calls = [], writes = [];
let deny = false, missing = false, failedWrite = false, foreignPage = false;
const http = {
  get: async url => {
    calls.push(url);
    if (url.includes('/fields')) return response({ value: (url.includes('News') ? schema(newsFields) : schema(viewFields)).filter(field => !missing || field.InternalName !== 'Category') });
    if (url.includes('$top=1')) return response({ value: [] }, deny ? 403 : 200);
    if (url.includes('Views')) return response({ value: [] });
    if (url.includes('page=2')) return response({ value: [{ Id: 2, Title: 'Second page', Category: 'GenAI' }] });
    return response({ value: [{ Id: 1, Title: 'List item', Category: 'GenAI', articledate: '2026-11-17T00:00:00Z', articlebody: 'Text from list', sourceurl: { Url: 'https://example.com/article' }, ArticleImageUrl: 'javascript:invalid', InDib: true }], '@odata.nextLink': foreignPage ? 'https://other.example/_api/items' : site + "/_api/web/lists/getByTitle('News')/items?page=2" });
  },
  post: async (url, config, options) => { writes.push({ url, payload: JSON.parse(options.body) }); return response({}, failedWrite ? 403 : 201); }
};
const service = (settings = {}) => new SharePointListsService(http, site, { newsList: 'News', viewsList: 'Views', enableTracking: false, ...settings }, { name: 'Reader', account: 'reader@example.com' });
const component = svc => {
  const c = new Component({ service: svc });
  c.setState = update => { c.state = { ...c.state, ...update }; };
  return c;
};
(async () => {
  assert.equal(categoryBanners.length, 9);
  assert.equal(new Set(categoryBanners.map(x => x.imageUrl)).size, 9);
  assert.equal(bannerForCategory('Unknown'), defaultBanner);
  assert.ok(!fs.existsSync(path.join(root, 'data')), 'No shipped data folder');
  assert.ok(!fs.readFileSync(path.join(root, 'components/InnovationPulse.tsx'), 'utf8').includes('../data/'));
  const live = service();
  const news = await live.getNews();
  assert.equal(news.length, 2, 'Follow pagination');
  assert.equal(news[0].sourceurl, 'https://example.com/article');
  assert.equal(news[0].ArticleImageUrl, '', 'Reject unsafe image URL');
  assert.equal(news[0].InDib, true);
  await live.getNews();
  assert.equal(calls.filter(url => url.includes('News') && url.includes('/fields')).length, 1, 'Cache schema');
  await live.track(news[0], 'Tile click');
  assert.equal(writes.length, 0, 'Tracking off by default');
  await service({ enableTracking: true }).track(news[0], 'Tile click');
  assert.equal(writes[0].payload.ArticleId, 1);
  assert.equal(writes[0].payload.SourceUrl.Url, 'https://example.com/article');
  await service({ enableTracking: true }).track({ Id: 0, Title: 'Innovation Pulse' }, 'Page view');
  assert.equal(writes[1].payload.ArticleId, 0);
  assert.equal(writes[1].payload.SourceUrl, null);
  failedWrite = true;
  await assert.rejects(service({ enableTracking: true }).track(news[0], 'Tile click'), /403/);
  failedWrite = false;
  deny = true;
  assert.equal(await live.canReadInsights(), false);
  deny = false;
  assert.equal(await live.canReadInsights(), true);
  assert.equal(await service({ viewsList: '' }).canReadInsights(), false);
  await assert.rejects(service({ newsList: '' }).getNews(), /set the news list/);
  missing = true;
  await assert.rejects(service().getNews(), /Missing column/);
  missing = false;
  foreignPage = true;
  await assert.rejects(service().getNews(), /pagination URL/);
  foreignPage = false;
  const c = component(live);
  await c.loadNews();
  assert.equal(c.state.items.length, 2);
  c.setState({ categoryFilter: 'GenAI' });
  assert.ok(renderToStaticMarkup(c.render()).includes('List item'));
  c.setState({ appliedSearchQuery: 'absent term' });
  assert.ok(renderToStaticMarkup(c.render()).includes('No articles match'));
  const unconfigured = component(service({ newsList: '' }));
  await unconfigured.loadNews();
  assert.equal(unconfigured.state.loading, false);
  assert.ok(unconfigured.state.error.includes('set the news list'));
  // Resolve a newer request first: old results must never replace it.
  const pending = [];
  const racing = component({ getNews: () => new Promise(resolve => pending.push(resolve)) });
  const first = racing.loadNews(), second = racing.loadNews();
  pending[1]([]); await second; pending[0](news); await first;
  assert.equal(racing.state.items.length, 0);
  const late = racing.loadNews(); racing.componentWillUnmount(); pending[2](news); await late;
  assert.equal(racing.state.items.length, 0, 'Ignore results after unmount');
  console.log('Live-list mapping, paging, permissions, tracking opt-in/failure, setup state, UI filtering, and request races passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
