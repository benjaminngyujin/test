/* eslint-disable no-void -- Async UI actions handle their errors internally; void marks intentionally unawaited calls. */
import * as React from 'react';
import { bannerForCategory } from '../data/categories';
import { MockLists, INewsItem, IViewEvent, InteractionType } from '../data/mockLists';
import { IInnovationPulseProps } from './IInnovationPulseProps';
import styles from './InnovationPulse.module.scss';
import { ArticleDialog } from './ArticleDialog';

interface IState { items: INewsItem[]; loading: boolean; categoryLoading: boolean; canViewInsights: boolean; error: string; selected: INewsItem | undefined; activeTab: 'articles' | 'insights'; viewEvents: IViewEvent[]; insightsLoading: boolean; insightsError: string; monthFilter: string; trackingError: string; searchOpen: boolean; searchQuery: string; appliedSearchQuery: string; categoryFilter: string; exportOpen: boolean; exportMonth: string; }
export default class InnovationPulse extends React.Component<IInnovationPulseProps, IState> {
  private disposed = false;
  private storySource: HTMLButtonElement | undefined;
  // LIVE-LIST ADAPTER EDIT POINT: see src/docs/live-lists.md before replacing MockLists.
  private readonly lists = new MockLists();
  public state: IState = { items: [], loading: true, categoryLoading: false, canViewInsights: false, error: '', selected: undefined, activeTab: 'articles', viewEvents: [], insightsLoading: false, insightsError: '', monthFilter: 'all', trackingError: '', searchOpen: false, searchQuery: '', appliedSearchQuery: '', categoryFilter: 'all', exportOpen: false, exportMonth: 'all' };

  public componentDidMount(): void { void this.loadNews(); void this.checkInsightsAccess(); void this.trackInteraction({ Id: 0, Title: 'Innovation Pulse' }, 'Page view'); }
  public componentWillUnmount(): void { this.disposed = true; }

  private async checkInsightsAccess(): Promise<void> {
    if (!this.disposed) this.setState({ canViewInsights: true });
  }

  private async loadNews(showRefreshDelay: boolean = false): Promise<void> {
    this.setState({ loading: true, error: '' });
    if (showRefreshDelay) await new Promise<void>(resolve => window.setTimeout(resolve, 300));
    if (!this.disposed) this.setState({ items: this.lists.getNews(), loading: false });
  }

  private async trackInteraction(item: { Id: number; Title: string; sourceurl?: string }, interactionType: InteractionType): Promise<void> {
    this.lists.track(item, interactionType);
    if (!this.disposed) this.setState({ viewEvents: this.lists.getViews(), trackingError: '' });
  }

  private async loadInsights(): Promise<void> {
    if (!this.state.canViewInsights || this.disposed) return;
    this.setState({ viewEvents: this.lists.getViews(), insightsLoading: false, insightsError: '' });
  }

  private openStory = (item: INewsItem, source?: HTMLButtonElement): void => { this.storySource = source; this.setState({ selected: item, trackingError: '' }); void this.trackInteraction(item, 'Tile click'); };
  private closeStory = (): void => this.setState({ selected: undefined });
  private closeSearch = (): void => this.setState({ searchOpen: false, searchQuery: this.state.appliedSearchQuery });
  private clearSearchFilter = (): void => this.setState({ searchQuery: '', appliedSearchQuery: '', searchOpen: false });
  private openSearch = (): void => this.setState({ searchOpen: true, searchQuery: this.state.appliedSearchQuery });
  private submitSearch = (event: React.FormEvent<HTMLFormElement>): void => { event.preventDefault(); this.setState({ appliedSearchQuery: this.state.searchQuery.trim(), searchOpen: false }); };
  private changeCategory = async (category: string): Promise<void> => {
    if (category === this.state.categoryFilter) return;
    this.setState({ categoryLoading: true });
    await new Promise<void>(resolve => { window.setTimeout(resolve, 1000); });
    if (!this.disposed) this.setState({ categoryFilter: category, categoryLoading: false });
  };
  private openExport = (): void => this.setState({ exportOpen: true, exportMonth: this.state.monthFilter });
  private closeExport = (): void => this.setState({ exportOpen: false });
  private exportCsv = (): void => {
    const month = this.state.exportMonth;
    const events = this.state.viewEvents.filter(event => month === 'all' || this.monthKey(event.ViewedAt) === month);
    const headers = ['Article', 'Interaction', 'Reader', 'Account', 'Viewed at'];
    const quote = (value: string): string => { const safe = /^[\s]*[=+\-@]/.test(value) ? "'" + value : value; return '"' + safe.replace(/"/g, '""') + '"'; };
    const rows = [headers, ...events.map(event => [event.Title || '', this.interactionType(event), event.ViewerName || 'Unknown user', event.ViewerAccount || 'Unknown account', event.ViewedAt || ''])];
    const csv = '\uFEFF' + rows.map(row => row.map(value => quote(String(value))).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'innovation-pulse-insights-' + (month === 'all' ? 'all-months' : month) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.closeExport();
  };
  private switchTab = (tab: 'articles' | 'insights'): void => { if (tab === 'insights' && !this.state.canViewInsights) return; this.setState({ activeTab: tab }); if (tab === 'insights') void this.loadInsights(); };
  private getSourceUrl(value?: string | { Url?: string; Description?: string }): string { return typeof value === 'string' ? value.trim() : value && value.Url ? value.Url.trim() : ''; }
  private safeUrl(value?: string | { Url?: string; Description?: string }): boolean { const url = this.getSourceUrl(value); return url.indexOf('https://') === 0 || url.indexOf('http://') === 0; }
  private monthKey(value?: string): string { if (!value) return ''; const date = new Date(value); if (isNaN(date.getTime())) return ''; return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2); }
  private monthLabel(key: string): string { const parts = key.split('-'); return new Date(Number(parts[0]), Number(parts[1]) - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }); }
  private formatDate(value?: string): string { if (!value) return 'Date unavailable'; const date = new Date(value); return isNaN(date.getTime()) ? value : date.toLocaleString(); }
  private interactionType(event: IViewEvent): InteractionType { return event.InteractionType === 'Page view' ? 'Page view' : event.InteractionType === 'Source article click' ? 'Source article click' : 'Tile click'; }
  private categoryFor(item: INewsItem): string { return (item.Category || '').trim() || 'Uncategorized'; }
  private latestFirst(a: INewsItem, b: INewsItem): number {
    const dateA = a.articledate ? new Date(a.articledate).getTime() : NaN;
    const dateB = b.articledate ? new Date(b.articledate).getTime() : NaN;
    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateB - dateA;
    if (!isNaN(dateA) && isNaN(dateB)) return -1;
    if (isNaN(dateA) && !isNaN(dateB)) return 1;
    const orderA = Number(String(a.Order || '').replace(/,/g, ''));
    const orderB = Number(String(b.Order || '').replace(/,/g, ''));
    if (!isNaN(orderA) && !isNaN(orderB) && orderA !== orderB) return orderB - orderA;
    return b.Id - a.Id;
  }
  private matchesSearch(item: INewsItem, query: string): boolean {
    if (!query) return true;
    const searchable = [item.Title || '', item.articlebody || '', item.articledate || '', this.categoryFor(item), this.getSourceUrl(item.sourceurl), item.SubCategory, item.Region, item.Country, item.SourcePublisher, item.DBSImplication].join(' ').toLowerCase();
    return searchable.indexOf(query) !== -1;
  }

  public render(): React.ReactElement<IInnovationPulseProps> {
    const { items, loading, categoryLoading, canViewInsights, error, selected, activeTab, viewEvents, insightsLoading, insightsError, monthFilter, trackingError, searchOpen, searchQuery, appliedSearchQuery, categoryFilter, exportOpen, exportMonth } = this.state;
    const query = appliedSearchQuery.trim().toLowerCase();
    const categories = Array.from(new Set(items.map(item => this.categoryFor(item)))).sort((a, b) => a.localeCompare(b));
    const matchingItems = items.filter(item => this.matchesSearch(item, query) && (categoryFilter === 'all' || this.categoryFor(item) === categoryFilter));
    const visibleCategories = categoryFilter === 'all' ? categories : [categoryFilter];
    const categorySections = visibleCategories.map(category => { const categoryItems = matchingItems.filter(item => this.categoryFor(item) === category).sort((a, b) => this.latestFirst(a, b)); return { category, items: categoryFilter === 'all' ? categoryItems.slice(0, 4) : categoryItems }; }).filter(section => section.items.length > 0);

    const months = Array.from(new Set(viewEvents.map(event => this.monthKey(event.ViewedAt)).filter(Boolean))).sort().reverse();
    const visibleEvents = viewEvents.filter(event => monthFilter === 'all' || this.monthKey(event.ViewedAt) === monthFilter);
    const pageViewEvents = visibleEvents.filter(event => this.interactionType(event) === 'Page view');
    const clickEvents = visibleEvents.filter(event => this.interactionType(event) !== 'Page view');
    const visitors = new Set(pageViewEvents.map(event => (event.ViewerAccount || event.ViewerName || '').toLowerCase()).filter(Boolean));
    const categoryTotals: { [key: string]: { tileClicks: number; sourceOpens: number } } = {};
    visibleEvents.forEach(event => {
      if (this.interactionType(event) === 'Page view') return;
      const item = items.find(article => String(article.Id) === String(event.ArticleId)) || items.find(article => article.Title === event.Title);
      const category = item ? this.categoryFor(item) : 'Unknown category';
      if (!categoryTotals[category]) categoryTotals[category] = { tileClicks: 0, sourceOpens: 0 };
      if (this.interactionType(event) === 'Source article click') categoryTotals[category].sourceOpens += 1;
      else categoryTotals[category].tileClicks += 1;
    });
    const categoryBreakdown = Object.keys(categoryTotals).map(category => ({ category, ...categoryTotals[category] })).sort((a, b) => (b.tileClicks + b.sourceOpens) - (a.tileClicks + a.sourceOpens) || a.category.localeCompare(b.category));
    const monthlyTotals: { [key: string]: { tileClicks: number; sourceOpens: number; pageViews: number } } = {};
    viewEvents.forEach(event => {
      const month = this.monthKey(event.ViewedAt);
      if (!month) return;
      if (!monthlyTotals[month]) monthlyTotals[month] = { tileClicks: 0, sourceOpens: 0, pageViews: 0 };
      if (this.interactionType(event) === 'Page view') monthlyTotals[month].pageViews += 1;
      else if (this.interactionType(event) === 'Source article click') monthlyTotals[month].sourceOpens += 1;
      else monthlyTotals[month].tileClicks += 1;
    });
    const monthIndex = (month: string): number => { const parts = month.split('-'); return Number(parts[0]) * 12 + Number(parts[1]) - 1; };
    const monthFromIndex = (index: number): string => { const year = Math.floor(index / 12); const month = index % 12 + 1; return year + '-' + ('0' + month).slice(-2); };
    const availableMonths = Object.keys(monthlyTotals).sort();
    let chartStart = availableMonths.length ? monthIndex(availableMonths[0]) : 0;
    let chartEnd = availableMonths.length ? monthIndex(availableMonths[availableMonths.length - 1]) : -1;
    if (monthFilter !== 'all') { chartEnd = monthIndex(monthFilter); chartStart = chartEnd - 1; }
    else if (chartStart === chartEnd && chartEnd >= 0) chartStart -= 1;
    const engagementByMonth: { month: string; tileClicks: number; sourceOpens: number; pageViews: number }[] = [];
    for (let index = chartStart; index <= chartEnd; index += 1) { const month = monthFromIndex(index); engagementByMonth.push({ month, tileClicks: monthlyTotals[month] ? monthlyTotals[month].tileClicks : 0, sourceOpens: monthlyTotals[month] ? monthlyTotals[month].sourceOpens : 0, pageViews: monthlyTotals[month] ? monthlyTotals[month].pageViews : 0 }); }
    const engagementMax = Math.max(1, ...engagementByMonth.map(row => Math.max(row.tileClicks, row.sourceOpens, row.pageViews)));
    const rawTick = engagementMax / 4;
    const tickMagnitude = Math.pow(10, Math.floor(Math.log(rawTick) / Math.LN10));
    const tickFactor = rawTick / tickMagnitude;
    const engagementTickStep = Math.max(1, (tickFactor <= 1 ? 1 : tickFactor <= 2 ? 2 : tickFactor <= 5 ? 5 : 10) * tickMagnitude);
    const engagementAxisMax = Math.max(engagementTickStep, Math.ceil(engagementMax / engagementTickStep) * engagementTickStep);
    const engagementTicks: number[] = [];
    for (let value = 0; value <= engagementAxisMax; value += engagementTickStep) engagementTicks.push(value);
    const chartLeft = 58;
    const chartTop = 18;
    const chartWidth = 700;
    const chartHeight = 190;
    const chartX = (index: number): number => chartLeft + (engagementByMonth.length < 2 ? chartWidth / 2 : index * chartWidth / (engagementByMonth.length - 1));
    const chartY = (value: number): number => chartTop + chartHeight - value * chartHeight / engagementAxisMax;
    const tileLine = engagementByMonth.map((row, index) => chartX(index) + ',' + chartY(row.tileClicks)).join(' ');
    const sourceLine = engagementByMonth.map((row, index) => chartX(index) + ',' + chartY(row.sourceOpens)).join(' ');
    const pageLine = engagementByMonth.map((row, index) => chartX(index) + ',' + chartY(row.pageViews)).join(' ');
    const monthLabelStep = Math.max(1, Math.ceil(engagementByMonth.length / 8));
    const categoryMax = Math.max(1, ...categoryBreakdown.map(row => row.tileClicks + row.sourceOpens));
    const categoryChartHeight = Math.max(56, categoryBreakdown.length * 42);
    const tileEvents = clickEvents.filter(event => this.interactionType(event) === 'Tile click');
    const sourceEvents = clickEvents.filter(event => this.interactionType(event) === 'Source article click');
    const readers = new Set(clickEvents.map(event => (event.ViewerAccount || event.ViewerName || '').toLowerCase()).filter(Boolean));
    const perArticle: { [key: string]: { title: string; tileClicks: number; sourceOpens: number } } = {};
    items.forEach(item => { perArticle[String(item.Id)] = { title: item.Title, tileClicks: 0, sourceOpens: 0 }; });
    visibleEvents.forEach(event => {
      if (this.interactionType(event) === 'Page view') return;
      const key = String(event.ArticleId || event.Title);
      if (!perArticle[key]) perArticle[key] = { title: event.Title, tileClicks: 0, sourceOpens: 0 };
      if (this.interactionType(event) === 'Source article click') perArticle[key].sourceOpens += 1;
      else perArticle[key].tileClicks += 1;
    });
    const rankedArticles = Object.keys(perArticle).map(key => perArticle[key]).filter(article => article.sourceOpens + article.tileClicks > 0).sort((a, b) => (b.sourceOpens + b.tileClicks) - (a.sourceOpens + a.tileClicks) || b.sourceOpens - a.sourceOpens || b.tileClicks - a.tileClicks || a.title.localeCompare(b.title)).slice(0, 5);

    return <main className={styles.page}>
      <header className={styles.hero} style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 23, 41, .65), rgba(9, 23, 41, .45) 45%, rgba(9, 23, 41, .05)), url("${bannerForCategory(categoryFilter)}")` }}><p className={styles.eyebrow}>Innovation Pulse</p><h1>{categoryFilter === 'all' ? 'Innovation Daily' : categoryFilter}</h1><p className={styles.intro}>Mock preview — fictional articles and readers. Changes last until this web part reloads.</p></header>
      <nav className={styles.tabs} role='tablist' aria-label='Innovation Pulse views'><button type='button' role='tab' aria-selected={activeTab === 'articles'} className={activeTab === 'articles' ? styles.activeTab : styles.tab} onClick={() => this.switchTab('articles')}>Articles</button>{canViewInsights && (<button type='button' role='tab' aria-selected={activeTab === 'insights'} className={activeTab === 'insights' ? styles.activeTab : styles.tab} onClick={() => this.switchTab('insights')}>Insights</button>)}</nav>
      {activeTab === 'articles' && <section role='tabpanel' aria-label='Articles'>
        <div className={styles.toolbar}>
          <div className={styles.toolbarStatus}><span aria-live='polite'>{loading ? 'Loading news…' : error ? 'News unavailable' : ''}</span>{appliedSearchQuery && <span className={styles.filterTag}><span>Filtered by “{appliedSearchQuery}”</span><button type='button' className={styles.clearFilter} onClick={this.clearSearchFilter} aria-label={'Clear search filter: ' + appliedSearchQuery}>×</button></span>}</div>
          <div className={styles.toolbarActions}>
            <select className={styles.categoryFilter} aria-label='Filter articles by category' value={categoryFilter} disabled={loading || categoryLoading} onChange={event => void this.changeCategory(event.currentTarget.value)}><option value='all'>All categories</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
            <button className={styles.searchLaunch} type='button' onClick={this.openSearch} aria-label='Search articles'><span aria-hidden='true'>⌕</span> Search</button>
            <button className={styles.refresh} type='button' disabled={loading || categoryLoading} onClick={() => void this.loadNews(true)}>{loading ? 'Loading…' : '↻ Refresh'}</button>
          </div>
        </div>
        {trackingError && <p className={styles.notice} role='status'>This interaction wasn&apos;t recorded. {trackingError}</p>}
        {(loading || categoryLoading) && <div className={styles.programLoading} role='status'><span className={styles.programLoadingIcon} aria-hidden='true' /><span>Loading articles...</span></div>}
        {!loading && !categoryLoading && error && <p className={styles.message} role='alert'>News could not be loaded: {error}</p>}
        {!loading && !categoryLoading && !error && items.length === 0 && <p className={styles.message}>No news items are in this list yet.</p>}
        {!loading && !categoryLoading && !error && items.length > 0 && matchingItems.length === 0 && <p className={styles.message}>No articles match these filters.</p>}
        {!loading && !categoryLoading && !error && categorySections.length > 0 && <div className={styles.categorySections}>{categorySections.map(section => <section className={styles.categorySection} key={section.category} aria-label={section.category + ' articles'}><div className={styles.categoryHeading}><h2>{section.category}</h2></div><div className={styles.grid}>{section.items.map(item => <button type='button' className={styles.card} key={item.Id} onClick={event => this.openStory(item, event.currentTarget)} aria-haspopup="dialog"><strong>{item.Title}</strong>{item.articledate && <span className={styles.date}>{item.articledate}</span>}{item.articlebody && <span className={styles.summary}>{item.articlebody.length > 300 ? item.articlebody.slice(0, 300) + '…' : item.articlebody}</span>}</button>)}</div></section>)}</div>}
      </section>}
      {activeTab === 'insights' && canViewInsights && <section role='tabpanel' aria-label='Article insights' className={styles.dashboard}><div className={styles.dashboardHeader}><div><h2>Article insights</h2><p>Page visits and article clicks are tracked separately.</p></div><div className={styles.insightControls}><label className={styles.monthControl}>Month<select value={monthFilter} onChange={event => this.setState({ monthFilter: event.currentTarget.value })}><option value='all'>All months</option>{months.map(month => <option key={month} value={month}>{this.monthLabel(month)}</option>)}</select></label><button type='button' className={styles.exportButton} onClick={this.openExport}>Export to CSV</button></div></div><p className={styles.privacyNote}>Mock interactions use fictional reader details and stay in memory. No SharePoint lists are read or updated.</p>{insightsLoading && <p className={styles.message} role='status'>Loading interaction records…</p>}{!insightsLoading && insightsError && <p className={styles.message} role='alert'>Insights couldn&apos;t be loaded: {insightsError}</p>}{!insightsLoading && !insightsError && <React.Fragment><div className={styles.metrics}><article className={styles.metric}><span>Page views</span><strong>{pageViewEvents.length}</strong></article><article className={styles.metric}><span>Unique visitors</span><strong>{visitors.size}</strong></article><article className={styles.metric}><span>Tile clicks</span><strong>{tileEvents.length}</strong></article><article className={styles.metric}><span>Source article opens</span><strong>{sourceEvents.length}</strong></article><article className={styles.metric}><span>Distinct clickers</span><strong>{readers.size}</strong></article></div><section className={styles.analyticsSection}><h3>Opens by article</h3>{rankedArticles.length === 0 ? <p className={styles.message}>No article clicks were recorded for this period.</p> : <div className={styles.tableWrap}><table className={styles.eventsTable}><thead><tr><th>Article</th><th>Total clicks</th><th>Tile clicks</th><th>Source opens</th></tr></thead><tbody>{rankedArticles.map(article => <tr key={article.title}><td>{article.title}</td><td>{article.tileClicks + article.sourceOpens}</td><td>{article.tileClicks}</td><td>{article.sourceOpens}</td></tr>)}</tbody></table></div>}</section><section className={styles.analyticsSection}><h3>Visits and clicks over time</h3>{engagementByMonth.length === 0 ? <p className={styles.message}>No dated interactions were recorded for this period.</p> : <div className={styles.chartWrap}><svg className={styles.chartSvg} viewBox='0 0 800 250' role='img' aria-label='Monthly page views, tile clicks and source article opens'><text x='10' y='14' className={styles.chartAxis}>Interactions</text>{engagementTicks.map(value => { const y = chartY(value); return <g key={value}><line x1={chartLeft} y1={y} x2={chartLeft + chartWidth} y2={y} className={styles.chartGridline}/><text x={chartLeft - 10} y={y + 4} textAnchor='end' className={styles.chartAxis}>{value}</text></g>; })}<polyline points={tileLine} className={styles.tileLine}/><polyline points={sourceLine} className={styles.sourceLine}/><polyline points={pageLine} className={styles.sourceLine} style={{ stroke: '#2b8a66' }}/>{engagementByMonth.map((row,index) => <g key={row.month}><circle cx={chartX(index)} cy={chartY(row.tileClicks)} r='4' className={styles.tilePoint}><title>{this.monthLabel(row.month)}: {row.tileClicks} tile clicks</title></circle><circle cx={chartX(index)} cy={chartY(row.sourceOpens)} r='4' className={styles.sourcePoint}><title>{this.monthLabel(row.month)}: {row.sourceOpens} source opens</title></circle><circle cx={chartX(index)} cy={chartY(row.pageViews)} r='4' className={styles.sourcePoint} style={{ fill: '#2b8a66' }}><title>{this.monthLabel(row.month)}: {row.pageViews} page views</title></circle>{(index % monthLabelStep === 0 || index === engagementByMonth.length - 1) && <text x={chartX(index)} y={chartTop + chartHeight + 24} textAnchor='middle' className={styles.chartAxis}>{this.monthLabel(row.month)}</text>}</g>)}</svg><div className={styles.chartLegend}><span><i className={styles.tileLegend}/>Tile clicks</span><span><i className={styles.sourceLegend}/>Source opens</span><span><i className={styles.sourceLegend} style={{ backgroundColor: '#2b8a66' }}/>Page views</span></div></div>}</section><section className={styles.analyticsSection}><h3>Interactions by category</h3>{categoryBreakdown.length === 0 ? <p className={styles.message}>No category interactions were recorded for this period.</p> : <div className={styles.chartWrap}><svg className={styles.chartSvg} viewBox={'0 0 1000 ' + (categoryChartHeight + 20)} role='img' aria-label='Tile clicks and source article opens by category'>{categoryBreakdown.map((row,index) => { const y=index*42+10; const total=row.tileClicks+row.sourceOpens; const tileWidth=row.tileClicks/categoryMax*620; const sourceWidth=row.sourceOpens/categoryMax*620; return <g key={row.category}><text x='290' y={y+16} textAnchor='end' className={styles.chartCategory}>{row.category}</text><rect x='305' y={y} width={tileWidth} height='22' rx='3' className={styles.categoryTileBar}/><rect x={305+tileWidth} y={y} width={sourceWidth} height='22' rx='3' className={styles.categorySourceBar}/><text x={Math.min(965,313+tileWidth+sourceWidth)} y={y+16} className={styles.chartValue}>{total}</text><title>{row.category}: {row.tileClicks} tile clicks, {row.sourceOpens} source opens</title></g>;})}</svg><div className={styles.chartLegend}><span><i className={styles.tileLegend}/>Tile clicks</span><span><i className={styles.sourceLegend}/>Source opens</span></div></div>}</section><section className={styles.analyticsSection}><h3>Visitor and click log</h3>{visibleEvents.length === 0 ? <p className={styles.message}>No tracked interactions for this period yet.</p> : <div className={styles.tableWrap}><table className={styles.eventsTable}><thead><tr><th>Interaction</th><th>Article</th><th>Reader</th><th>Account</th><th>When</th></tr></thead><tbody>{visibleEvents.map(event => <tr key={event.Id}><td>{this.interactionType(event)}</td><td>{event.Title}</td><td>{event.ViewerName || 'Unknown user'}</td><td>{event.ViewerAccount || 'Unknown account'}</td><td>{this.formatDate(event.ViewedAt)}</td></tr>)}</tbody></table></div>}</section></React.Fragment>}</section>}
      {exportOpen && <div className={styles.searchOverlay} onClick={this.closeExport}><section className={styles.exportPanel} role='dialog' aria-modal='true' aria-labelledby='export-title' onClick={event => event.stopPropagation()}><div className={styles.searchHeader}><h2 id='export-title'>Export insights to CSV</h2><button type='button' className={styles.close} onClick={this.closeExport} aria-label='Close export dialog'>×</button></div><label className={styles.monthControl}>Month to export<select value={exportMonth} onChange={event => this.setState({ exportMonth: event.currentTarget.value })}><option value='all'>All months</option>{months.map(month => <option key={month} value={month}>{this.monthLabel(month)}</option>)}</select></label><div className={styles.exportActions}><button type='button' className={styles.exportCancel} onClick={this.closeExport}>Cancel</button><button type='button' className={styles.exportButton} onClick={this.exportCsv}>Export CSV</button></div></section></div>}
      {searchOpen && <div className={styles.searchOverlay} onClick={this.closeSearch}><section className={styles.searchPanel} role='dialog' aria-modal='true' aria-labelledby='search-title' onClick={event => event.stopPropagation()}><div className={styles.searchHeader}><h2 id='search-title'>Search Innovation Daily</h2><button type='button' className={styles.close} onClick={this.closeSearch} aria-label='Close search'>×</button></div><form className={styles.searchForm} onSubmit={this.submitSearch}><input className={styles.searchInput} type='search' autoFocus value={searchQuery} onChange={event => this.setState({ searchQuery: event.currentTarget.value })} onKeyDown={event => { if (event.key === 'Escape') this.closeSearch(); }} placeholder='Search articles, then press Enter' aria-label='Search articles' /></form></section></div>}
      {selected && <ArticleDialog key={selected.Id} title={selected.Title} source={this.storySource} onClose={this.closeStory}>{selected.articledate && <p className={styles.date}>{selected.articledate}</p>}<img src={selected.ArticleImageUrl} alt='Illustrative mock article' className={styles.articleImage} />
        <dl><dt>Category / sub category</dt><dd>{selected.Category} / {selected.SubCategory}</dd><dt>Region / country</dt><dd>{selected.Region} / {selected.Country}</dd><dt>Source publisher</dt><dd>{selected.SourcePublisher}</dd><dt>Source publish date</dt><dd>{this.formatDate(selected.SourcePublishDate)}</dd><dt>Upload date</dt><dd>{this.formatDate(selected.articledate)}</dd><dt>In DIB</dt><dd>{selected.InDib ? 'Yes' : 'No'}</dd></dl>
        <p className={styles.modalBody}>{selected.articlebody}</p><h3>DBS implication</h3><p>{selected.DBSImplication}</p>{this.safeUrl(selected.sourceurl) && <a className={styles.sourceLink} href={this.getSourceUrl(selected.sourceurl)} target='_blank' rel='noopener noreferrer' onClick={() => void this.trackInteraction(selected, 'Source article click')}>Open mock source (example.com)</a>}</ArticleDialog>}
    </main>;
  }
}
