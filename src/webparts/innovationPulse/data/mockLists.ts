/** Display-column names supplied by the user; these are not assumed SharePoint internal names. */
export interface IMockNewsRow {
  Id: number;
  'article title': string;
  'upload date': string;
  'article body': string;
  'source url': string;
  category: string;
  'sub category': string;
  region: string;
  'source publish date': string;
  country: string;
  'DBS implication': string;
  'source publisher': string;
  'article image url': string;
  in_dib: boolean;
}
export type InteractionType = 'Tile click' | 'Source article click' | 'Page view';
export interface IMockViewRow {
  Id: number;
  article: string;
  'article ID': number;
  'viewer name': string;
  'viewer account': string;
  'original source URL': string;
  'viewed at': string;
  'interaction type': InteractionType;
}
export interface INewsItem {
  Id: number; Title: string; articlebody: string; sourceurl: string; articledate: string;
  Order: number; Category: string; SubCategory: string; Region: string; Country: string;
  SourcePublishDate: string; DBSImplication: string; SourcePublisher: string;
  ArticleImageUrl: string; InDib: boolean;
}
export interface IViewEvent {
  Id: number; Title: string; ArticleId: number; ViewerName: string; ViewerAccount: string;
  SourceUrl: string; ViewedAt: string; InteractionType: InteractionType;
}

// EDIT POINT: fictional news fixtures; live-list migration: src/docs/live-lists.md.
// Fictional examples only. Links use the reserved example.com domain.
const examples = [
  [
    "Portfolio sandbox compares retirement scenarios",
    "Asset & Wealth",
    "Goal-based investing",
    "Singapore",
    "Southeast Asia"
  ],
  [
    "Advisers prototype a clearer view of family assets",
    "Asset & Wealth",
    "Wealth planning",
    "Hong Kong",
    "East Asia"
  ],
  [
    "Tokenized bond sandbox explores settlement workflows",
    "Blockchain, Web3 & DeFi",
    "Tokenization",
    "Singapore",
    "Southeast Asia"
  ],
  [
    "Research team models liquidity risks in DeFi pools",
    "Blockchain, Web3 & DeFi",
    "Decentralized finance",
    "Switzerland",
    "Europe"
  ],
  [
    "Customers test accessible mobile banking journeys",
    "Customer & User Experience",
    "Accessibility",
    "India",
    "South Asia"
  ],
  [
    "Service team trials multilingual onboarding prompts",
    "Customer & User Experience",
    "Customer onboarding",
    "Taiwan",
    "East Asia"
  ],
  [
    "Innovation lab explores ambient computing for branches",
    "Emerging Innovations, Buzz & Trends",
    "Ambient computing",
    "Japan",
    "East Asia"
  ],
  [
    "Horizon scan examines next-generation battery services",
    "Emerging Innovations, Buzz & Trends",
    "Energy technology",
    "Australia",
    "Oceania"
  ],
  [
    "AI assistant helps teams explore customer feedback",
    "GenAI",
    "Generative AI",
    "Singapore",
    "Southeast Asia"
  ],
  [
    "Researchers prototype visual document understanding",
    "GenAI",
    "Neural networks",
    "South Korea",
    "East Asia"
  ],
  [
    "SME lending sandbox explores cash-flow signals",
    "Lending",
    "Cash-flow lending",
    "Indonesia",
    "Southeast Asia"
  ],
  [
    "Borrowers test a clearer mortgage comparison journey",
    "Lending",
    "Mortgage experience",
    "United Kingdom",
    "Europe"
  ],
  [
    "Mixed-reality prototype supports remote branch training",
    "Metaverse & Mixed Reality",
    "Spatial training",
    "Hong Kong",
    "East Asia"
  ],
  [
    "Designers explore immersive financial education",
    "Metaverse & Mixed Reality",
    "Virtual worlds",
    "United States",
    "North America"
  ],
  [
    "Small businesses explore faster invoice payments",
    "Payments",
    "Business payments",
    "Singapore",
    "Southeast Asia"
  ],
  [
    "Local merchants trial a simpler checkout experience",
    "Payments",
    "Merchant services",
    "Indonesia",
    "Southeast Asia"
  ],
  [
    "Research lab models a superconducting quantum processor",
    "Quantum Computing",
    "Superconducting qubits",
    "Finland",
    "Europe"
  ],
  [
    "Banking sandbox compares quantum portfolio algorithms",
    "Quantum Computing",
    "Quantum optimization",
    "Canada",
    "North America"
  ]
];
const illustration = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><rect width="640" height="320" fill="#edf4ff"/><circle cx="320" cy="130" r="65" fill="#365fa8"/><path d="M220 245h200" stroke="#365fa8" stroke-width="14"/><text x="320" y="295" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#243449">Illustrative mock article</text></svg>');
export const mockNewsRows: IMockNewsRow[] = examples.map((entry, index) => ({
  Id: index + 1,
  'article title': entry[0],
  'upload date': new Date(Date.UTC(2026, 10, 17 - index)).toISOString(),
  'article body': `This is fictional demonstration content for ${entry[1].toLowerCase()} in ${entry[3]}. A sample team is exploring ${entry[2].toLowerCase()} through a small prototype and user interviews.\n\nThe exercise focuses on usability, operational effort, and customer needs. No actual launch, partnership, or business result is being reported.`,
  'source url': `https://example.com/mock-news/${index + 1}`,
  category: entry[1], 'sub category': entry[2], region: entry[4], country: entry[3],
  'source publish date': new Date(Date.UTC(2026, 10, 16 - index)).toISOString(),
  'DBS implication': 'Illustrative discussion prompt: assess customer value, operational feasibility, and opportunities for a small experiment. This is not an approved DBS recommendation.',
  'source publisher': 'Demo Innovation Journal', 'article image url': illustration, in_dib: index % 3 !== 0
}));

export const mockViewRows: IMockViewRow[] = Array.from({ length: 30 }, (_, index) => {
  const article = mockNewsRows[index % mockNewsRows.length];
  const kind: InteractionType = index % 3 === 0 ? 'Page view' : index % 3 === 1 ? 'Tile click' : 'Source article click';
  return {
    Id: index + 1, article: kind === 'Page view' ? 'Innovation Pulse' : article['article title'],
    'article ID': kind === 'Page view' ? 0 : article.Id,
    'viewer name': ['Demo Reader A', 'Demo Reader B', 'Demo Reader C', 'Demo Reader D'][index % 4],
    'viewer account': `demo-reader-${index % 4 + 1}@example.com`,
    'original source URL': kind === 'Page view' ? '' : article['source url'],
    'viewed at': `2026-${index < 15 ? '10' : '11'}-${('0' + (index % 14 + 1)).slice(-2)}T10:00:00+08:00`,
    'interaction type': kind
  };
});

/** One in-memory pair of lists per component; reload/remount resets to seeded records. */
export class MockLists {
  private views: IMockViewRow[] = mockViewRows.map(row => ({ ...row }));
  public getNews(): INewsItem[] {
    return mockNewsRows.map(row => ({
      Id: row.Id, Title: row['article title'], articlebody: row['article body'],
      sourceurl: row['source url'], articledate: row['upload date'], Order: row.Id,
      Category: row.category, SubCategory: row['sub category'], Region: row.region, Country: row.country,
      SourcePublishDate: row['source publish date'], DBSImplication: row['DBS implication'],
      SourcePublisher: row['source publisher'], ArticleImageUrl: row['article image url'], InDib: row.in_dib
    }));
  }
  public getViews(): IViewEvent[] {
    return this.views.map(row => ({
      Id: row.Id, Title: row.article, ArticleId: row['article ID'], ViewerName: row['viewer name'],
      ViewerAccount: row['viewer account'], SourceUrl: row['original source URL'],
      ViewedAt: row['viewed at'], InteractionType: row['interaction type']
    })).sort((a, b) => Date.parse(b.ViewedAt) - Date.parse(a.ViewedAt));
  }
  public track(item: { Id: number; Title: string; sourceurl?: string }, kind: InteractionType): void {
    this.views.push({
      Id: this.views.length + 1, article: item.Title, 'article ID': item.Id,
      'viewer name': 'Demo Reader', 'viewer account': 'demo.reader@example.com',
      'original source URL': item.sourceurl || '', 'viewed at': new Date().toISOString(), 'interaction type': kind
    });
  }
}
