import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { INewsItem, IViewEvent, InteractionType } from '../models/NewsModels';
import { IInnovationPulseService } from './IInnovationPulseService';
import { newsFields, requiredNewsFields, viewFields } from './listSchema';

interface IField { Title: string; InternalName: string; TypeAsString: string; }
interface IRecord { [name: string]: unknown; }
interface IPage<T> { value: T[]; '@odata.nextLink'?: string; 'odata.nextLink'?: string; }
type FieldMap = { [property: string]: IField | undefined };
export interface IListSettings {
  newsList: string; viewsList: string; enableTracking: boolean;
}

/** Real same-site SharePoint lists only. SPHttpClient supplies the user's auth. */
export class SharePointListsService implements IInnovationPulseService {
  private readonly schemas: { [list: string]: Promise<IField[]> | undefined } = {};
  public constructor(
    private readonly http: SPHttpClient,
    private readonly webUrl: string,
    private readonly settings: IListSettings,
    private readonly reader: { name: string; account: string }
  ) {}

  private listUrl(list: string): string {
    const value = list.trim();
    if (!value) throw new Error('Edit this web part and set the news list name or GUID.');
    const guid = value.replace(/[{}]/g, '');
    const selector = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(guid)
      ? `lists(guid'${guid}')` : `lists/getByTitle('${encodeURIComponent(value.replace(/'/g, "''")).replace(/'/g, '%27')}')`;
    return this.webUrl.replace(/\/$/, '') + '/_api/web/' + selector;
  }
  private async get(url: string): Promise<SPHttpClientResponse> {
    return this.http.get(url, SPHttpClient.configurations.v1, { headers: { Accept: 'application/json;odata=nometadata', 'odata-version': '' } });
  }
  private async pages<T>(url: string): Promise<T[]> {
    const rows: T[] = [];
    const seen = new Set<string>();
    while (url) {
      // Only follow SharePoint pagination within this web's REST API.
      const next = new URL(url, this.webUrl + '/');
      const base = new URL(this.webUrl.replace(/\/$/, '') + '/_api/');
      if (next.origin !== base.origin || next.pathname.indexOf(base.pathname) !== 0 || seen.has(next.href)) {
        throw new Error('Invalid or repeated SharePoint pagination URL.');
      }
      seen.add(next.href);
      const response = await this.get(next.href);
      if (!response.ok) throw new Error(`SharePoint request failed (${response.status}). Check the list name and permissions.`);
      const page: IPage<T> = await response.json();
      if (!Array.isArray(page.value)) throw new Error('Unexpected SharePoint list response.');
      rows.push(...page.value);
      url = page['@odata.nextLink'] || page['odata.nextLink'] || '';
    }
    return rows;
  }
  private async fields(list: string, names: { [property: string]: string }, required: string[]): Promise<FieldMap> {
    if (!this.schemas[list]) this.schemas[list] = this.pages<IField>(this.listUrl(list) + '/fields?$select=Title,InternalName,TypeAsString');
    let fields: IField[];
    try { fields = await this.schemas[list] as IField[]; }
    catch (error) { delete this.schemas[list]; throw error; }
    const map: FieldMap = {};
    Object.keys(names).forEach(key => {
      const name = names[key].toLowerCase();
      const matches = fields.filter(field => field.InternalName.toLowerCase() === name);
      const display = fields.filter(field => field.Title.toLowerCase() === name);
      if (!matches.length && display.length > 1) throw new Error(`Ambiguous column "${names[key]}". Set its internal name in services/listSchema.ts.`);
      const field = matches[0] || display[0];
      if (!field && required.indexOf(key) !== -1) throw new Error(`Missing column "${names[key]}". Update services/listSchema.ts to match your list.`);
      if (field && !/^(Text|Note|Choice|Number|Integer|DateTime|Boolean|URL)$/.test(field.TypeAsString)) {
        throw new Error(`Column "${names[key]}" uses unsupported type ${field.TypeAsString}. Update the service mapping.`);
      }
      if (field) {
        const expected = key === 'ArticleId' ? /^(Number|Integer)$/
          : ['articledate', 'SourcePublishDate', 'ViewedAt'].indexOf(key) !== -1 ? /^DateTime$/
          : key === 'InDib' ? /^Boolean$/
          : ['sourceurl', 'SourceUrl', 'ArticleImageUrl'].indexOf(key) !== -1 ? /^(Text|URL)$/
          : /^(Text|Note|Choice)$/;
        if (!expected.test(field.TypeAsString)) throw new Error(`Column "${names[key]}" has an incompatible type (${field.TypeAsString}). See src/docs/live-lists.md.`);
      }
      map[key] = field;
    });
    return map;
  }
  private async records(list: string, fields: FieldMap): Promise<IRecord[]> {
    const select = ['Id'].concat(Object.keys(fields).map(key => fields[key]?.InternalName || '').filter(Boolean));
    return this.pages<IRecord>(this.listUrl(list) + '/items?$select=' + encodeURIComponent(Array.from(new Set(select)).join(',')) + '&$top=500');
  }
  private value(row: IRecord, fields: FieldMap, key: string): unknown { return row[fields[key]?.InternalName || '']; }
  private text(value: unknown): string { return typeof value === 'string' ? value : ''; }
  private url(value: unknown): string {
    const url = this.text(typeof value === 'object' && value ? (value as { Url?: string }).Url : value).trim();
    return /^https?:\/\//i.test(url) ? url : '';
  }
  private date(value: unknown): string { const text = this.text(value); return text && !isNaN(Date.parse(text)) ? text : ''; }
  private plain(value: unknown): string {
    const text = this.text(value);
    return /<\/?[a-z][\s\S]*>/i.test(text) ? new DOMParser().parseFromString(text, 'text/html').body.textContent || '' : text;
  }
  public async getNews(): Promise<INewsItem[]> {
    const list = this.settings.newsList;
    const fields = await this.fields(list, newsFields, requiredNewsFields);
    const rows = await this.records(list, fields);
    return rows.map(row => {
      const value = (key: string): unknown => this.value(row, fields, key);
      return {
        Id: Number(row.Id), Order: Number(row.Id), Title: this.text(value('Title')),
        articlebody: this.plain(value('articlebody')), articledate: this.date(value('articledate')),
        sourceurl: this.url(value('sourceurl')), Category: this.text(value('Category')),
        SubCategory: this.text(value('SubCategory')), Region: this.text(value('Region')), Country: this.text(value('Country')),
        SourcePublishDate: this.date(value('SourcePublishDate')), DBSImplication: this.plain(value('DBSImplication')),
        SourcePublisher: this.text(value('SourcePublisher')), ArticleImageUrl: this.url(value('ArticleImageUrl')),
        InDib: value('InDib') === true || value('InDib') === 1
      };
    });
  }
  public async canReadInsights(): Promise<boolean> {
    if (!this.settings.viewsList.trim()) return false;
    const response = await this.get(this.listUrl(this.settings.viewsList) + '/items?$select=Id&$top=1');
    if (response.status === 401 || response.status === 403) return false;
    if (!response.ok) throw new Error(`Insights list could not be read (${response.status}).`);
    return true;
  }
  public async getViews(): Promise<IViewEvent[]> {
    if (!this.settings.viewsList.trim()) return [];
    const fields = await this.fields(this.settings.viewsList, viewFields, Object.keys(viewFields));
    const rows = await this.records(this.settings.viewsList, fields);
    return rows.map(row => {
      const value = (key: string): unknown => this.value(row, fields, key);
      return { Id: Number(row.Id), Title: this.text(value('Title')), ArticleId: Number(value('ArticleId')),
        ViewerName: this.text(value('ViewerName')), ViewerAccount: this.text(value('ViewerAccount')),
        SourceUrl: this.url(value('SourceUrl')), ViewedAt: this.date(value('ViewedAt')),
        InteractionType: this.text(value('InteractionType')) as InteractionType };
    }).filter(row => ['Page view', 'Tile click', 'Source article click'].indexOf(row.InteractionType) !== -1)
      .sort((a, b) => Date.parse(b.ViewedAt) - Date.parse(a.ViewedAt));
  }
  public async track(item: { Id: number; Title: string; sourceurl?: string }, kind: InteractionType): Promise<void> {
    if (!this.settings.enableTracking || !this.settings.viewsList.trim()) return;
    const fields = await this.fields(this.settings.viewsList, viewFields, Object.keys(viewFields));
    const values: IRecord = { Title: item.Title, ArticleId: item.Id, ViewerName: this.reader.name,
      ViewerAccount: this.reader.account, SourceUrl: this.url(item.sourceurl), ViewedAt: new Date().toISOString(), InteractionType: kind };
    const payload: IRecord = {};
    Object.keys(fields).forEach(key => {
      const field = fields[key];
      if (field) payload[field.InternalName] = field.TypeAsString === 'URL'
        ? (values[key] ? { Url: values[key], Description: '' } : null) : values[key];
    });
    const response = await this.http.post(this.listUrl(this.settings.viewsList) + '/items', SPHttpClient.configurations.v1, {
      headers: { Accept: 'application/json;odata=nometadata', 'Content-Type': 'application/json;odata=nometadata', 'odata-version': '' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Interaction could not be saved (${response.status}).`);
  }
}
