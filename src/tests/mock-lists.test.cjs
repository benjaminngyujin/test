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
    module, exports: module.exports,
    require(name) {
      if (name === 'react') return React;
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
const { MockLists, mockNewsRows, mockViewRows } = load(path.join(root, 'data/mockLists.ts'));
const fields = ['article title', 'upload date', 'article body', 'source url', 'category', 'sub category', 'region', 'source publish date', 'country', 'DBS implication', 'source publisher', 'article image url', 'in_dib'];
for (const row of mockNewsRows) {
  for (const field of fields) assert.ok(field in row, 'Missing ' + field);
  assert.equal(typeof row.in_dib, 'boolean');
}
const { categoryBanners, bannerForCategory, defaultBanner } = load(path.join(root, 'data/categories.ts'));
const expectedCategories = ['Asset & Wealth', 'Blockchain, Web3 & DeFi', 'Customer & User Experience', 'Emerging Innovations, Buzz & Trends', 'GenAI', 'Lending', 'Metaverse & Mixed Reality', 'Payments', 'Quantum Computing'];
assert.deepEqual(Array.from(categoryBanners, entry => entry.name), expectedCategories);
assert.equal(new Set(categoryBanners.map(entry => entry.imageUrl)).size, 9);
assert.equal(bannerForCategory('all'), defaultBanner);
assert.equal(bannerForCategory('Future category'), defaultBanner);
for (const category of expectedCategories) {
  assert.equal(mockNewsRows.filter(row => row.category === category).length, 2);
  assert.notEqual(bannerForCategory(category), defaultBanner);
}
for (const row of mockNewsRows) {
  assert.ok(Number.isFinite(Date.parse(row['upload date'])));
  assert.ok(Date.parse(row['source publish date']) <= Date.parse(row['upload date']));
}
const first = new MockLists();
const second = new MockLists();
const news = first.getNews();
assert.equal(news.length, 18);
assert.equal(new Set(news.map(row => row.Category)).size, 9);
assert.equal(news[0].DBSImplication, mockNewsRows[0]['DBS implication']);
for (const row of mockViewRows) {
  assert.ok(row['article ID'] === 0 || news.some(item => item.Id === row['article ID']));
}
first.track(news[0], 'Tile click');
assert.equal(first.getViews().length, mockViewRows.length + 1);
assert.equal(second.getViews().length, mockViewRows.length, 'Instances must not share new interactions');
assert.equal(mockViewRows.length, 30, 'Seed records must remain unchanged');
first.getNews()[0].Title = 'Changed';
assert.notEqual(first.getNews()[0].Title, 'Changed');
const Component = load(path.join(root, 'components/InnovationPulse.tsx')).default;
const component = new Component({});
component.setState = update => { component.state = { ...component.state, ...update }; };
component.componentDidMount();
assert.equal(component.state.items.length, 18);
assert.equal(component.state.canViewInsights, true);
assert.equal(component.state.viewEvents.length, 31, 'Mount records a page view');
component.openStory(component.state.items[0]);
assert.equal(component.state.viewEvents.length, 32);
assert.equal(component.state.selected.Id, 1);
assert.ok(component.matchesSearch(component.state.items[0], 'singapore'));
assert.ok(!component.matchesSearch(component.state.items[0], 'no-such-article'));
assert.ok(renderToStaticMarkup(component.render()).includes('DBS implication'));
component.closeStory();
for (const category of expectedCategories) {
  component.setState({ categoryFilter: category });
  const html = renderToStaticMarkup(component.render());
  const encoded = value => value.replace(/&/g, '&amp;');
  assert.ok(html.includes('<h1>' + encoded(category) + '</h1>'));
  assert.ok(html.includes(bannerForCategory(category)));
  for (const item of news) assert.equal(html.includes('<strong>' + encoded(item.Title) + '</strong>'), item.Category === category);
}
component.setState({ categoryFilter: 'GenAI', appliedSearchQuery: 'no-such-article' });
assert.ok(renderToStaticMarkup(component.render()).includes('No articles match these filters.'));
component.setState({ categoryFilter: 'all', appliedSearchQuery: '' });
const allMarkup = renderToStaticMarkup(component.render());
for (const item of news) assert.ok(allMarkup.includes(item.Title));
assert.ok(allMarkup.includes(defaultBanner));
component.switchTab('insights');
const markup = renderToStaticMarkup(component.render());
assert.ok(markup.includes('Demo Reader'));
assert.ok(markup.includes('Visitor and click log'));
assert.ok(markup.includes('No SharePoint lists are read or updated'));
component.componentWillUnmount();
console.log('Mock schema, mapping, isolation, search, article rendering, insights, and interaction checks passed.');
