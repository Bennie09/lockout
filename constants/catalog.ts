export type CatalogApp = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  onColor: string;
  androidPackage: string;
};

export const CATALOG: CatalogApp[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    tagline: 'Reels, stories, the scroll',
    color: '#C13584',
    onColor: '#F3EDE3',
    androidPackage: 'com.instagram.android',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    tagline: 'For You, forever',
    color: '#14D4C8',
    onColor: '#0C0B0A',
    androidPackage: 'com.zhiliaoapp.musically',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    tagline: 'Videos and Shorts',
    color: '#E23D3D',
    onColor: '#F3EDE3',
    androidPackage: 'com.google.android.youtube',
  },
  {
    id: 'x',
    name: 'X',
    tagline: 'Timeline and replies',
    color: '#E7E9EA',
    onColor: '#0C0B0A',
    androidPackage: 'com.twitter.android',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    tagline: 'Snaps and stories',
    color: '#F5E44A',
    onColor: '#0C0B0A',
    androidPackage: 'com.snapchat.android',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    tagline: 'Feed, groups, reels',
    color: '#3B82F6',
    onColor: '#F3EDE3',
    androidPackage: 'com.facebook.katana',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    tagline: 'Threads without end',
    color: '#FF6A33',
    onColor: '#0C0B0A',
    androidPackage: 'com.reddit.frontpage',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    tagline: 'Chats and status',
    color: '#2FBF6B',
    onColor: '#0C0B0A',
    androidPackage: 'com.whatsapp',
  },
  {
    id: 'discord',
    name: 'Discord',
    tagline: 'Servers and DMs',
    color: '#6D78F2',
    onColor: '#F3EDE3',
    androidPackage: 'com.discord',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    tagline: 'Pins and boards',
    color: '#E3242B',
    onColor: '#F3EDE3',
    androidPackage: 'com.pinterest',
  },
];

export function catalogById(id: string) {
  return CATALOG.find((app) => app.id === id);
}
