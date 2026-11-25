import categoriesJson from '@shared/categories.json';
import siteJson from '@shared/site.json';
import resourcesJson from '@shared/resources.json';
import creditsJson from '@shared/credits.json';

export type Standard = { code: string; title: string };
export type Category = {
  slug: string;
  name: string;
  image: string;
  summary: string;
  products: string[];
  standards: Standard[];
  testFocus: string[];
  extraDocuments: string[];
  preparation: string[];
  mistakes: string[];
  timeline: string;
};
export type DocItem = { key: string; title: string; detail: string };
export type Stage = { n: number; key: string; title: string; duration: string; text: string; deliverables: string[] };
export type Service = { key: string; icon: string; title: string; short: string; points: string[] };
export type Faq = { group: string; q: string; a: string };
export type Block = { p?: string; h?: string; ul?: string[] };
export type Resource = {
  slug: string;
  type: string;
  title: string;
  summary: string;
  date: string;
  readMinutes: number;
  tags: string[];
  body: Block[];
};
export type Credit = { file: string; author: string; license: string; licenseUrl: string; source: string };

export const COMMON_DOCUMENTS = categoriesJson.commonDocuments as DocItem[];
export const CATEGORIES = categoriesJson.categories as Category[];
export const COMPANY = siteJson.company;
export const PROCESS = siteJson.process as Stage[];
export const SERVICES = siteJson.services as Service[];
export const INDUSTRIES = siteJson.industries;
export const FAQS = siteJson.faqs as Faq[];
export const TIMELINE = siteJson.timeline;
export const RESOURCES = resourcesJson as Resource[];
export const CREDITS = creditsJson as Credit[];

export const RESOURCE_TYPES = ['DVGW Article', 'Certification Guide', 'Export Guide', 'German Standards', 'Industry Update', 'White Paper', 'Success Story'];
