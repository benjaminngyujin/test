/** EDIT POINT: exact category labels and decorative banner images.
 * Bundled AI-generated JPEGs; see src/docs/banner-prompts.md for prompts and replacement.
 * Static requires let SPFx copy/hash the assets into the deployment package.
 * Approved SharePoint HTTPS image URLs can also be assigned to imageUrl.
 */
export interface ICategoryBanner { name: string; imageUrl: string; }
export const categoryBanners: ICategoryBanner[] = [
  { name: 'Asset & Wealth', imageUrl: require('../assets/banners/wealth.jpg') },
  { name: 'Blockchain, Web3 & DeFi', imageUrl: require('../assets/banners/blockchain.jpg') },
  { name: 'Customer & User Experience', imageUrl: require('../assets/banners/experience.jpg') },
  { name: 'Emerging Innovations, Buzz & Trends', imageUrl: require('../assets/banners/trends.jpg') },
  { name: 'GenAI', imageUrl: require('../assets/banners/genai.jpg') },
  { name: 'Lending', imageUrl: require('../assets/banners/lending.jpg') },
  { name: 'Metaverse & Mixed Reality', imageUrl: require('../assets/banners/metaverse.jpg') },
  { name: 'Payments', imageUrl: require('../assets/banners/payments.jpg') },
  { name: 'Quantum Computing', imageUrl: require('../assets/banners/quantum.jpg') }
];
// eslint-disable-next-line @typescript-eslint/no-var-requires -- SPFx webpack resolves this static asset to its deployed URL.
export const defaultBanner: string = require('../assets/banners/landing.jpg');
export function bannerForCategory(category: string): string {
  const match = categoryBanners.filter(entry => entry.name === category)[0];
  return match ? match.imageUrl : defaultBanner;
}
