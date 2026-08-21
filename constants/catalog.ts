export type CatalogApp = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  onColor: string;
  androidPackages: string[];
};

export const CATALOG: CatalogApp[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    tagline: 'Reels, stories, the scroll',
    color: '#E1306C',
    onColor: '#F3EDE3',
    androidPackages: ['com.instagram.android'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    tagline: 'For You, forever',
    color: '#FE2C55',
    onColor: '#F3EDE3',
    androidPackages: ['com.zhiliaoapp.musically', 'com.ss.android.ugc.trill'],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    tagline: 'Videos and Shorts',
    color: '#FF0000',
    onColor: '#F3EDE3',
    androidPackages: ['com.google.android.youtube'],
  },
  {
    id: 'x',
    name: 'X',
    tagline: 'Timeline and replies',
    color: '#0A0A0A',
    onColor: '#F3EDE3',
    androidPackages: ['com.twitter.android'],
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    tagline: 'Snaps and stories',
    color: '#FFFC00',
    onColor: '#0C0B0A',
    androidPackages: ['com.snapchat.android'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    tagline: 'Feed, groups, reels',
    color: '#1877F2',
    onColor: '#F3EDE3',
    androidPackages: ['com.facebook.katana', 'com.facebook.lite'],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    tagline: 'Threads without end',
    color: '#FF4500',
    onColor: '#0C0B0A',
    androidPackages: ['com.reddit.frontpage'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    tagline: 'Chats and status',
    color: '#25D366',
    onColor: '#0C0B0A',
    androidPackages: ['com.whatsapp', 'com.whatsapp.w4b'],
  },
  {
    id: 'discord',
    name: 'Discord',
    tagline: 'Servers and DMs',
    color: '#5865F2',
    onColor: '#F3EDE3',
    androidPackages: ['com.discord'],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    tagline: 'Pins and boards',
    color: '#E60023',
    onColor: '#F3EDE3',
    androidPackages: ['com.pinterest'],
  },
];

export function catalogById(id: string) {
  return CATALOG.find((app) => app.id === id);
}

export function packagesFor(id: string) {
  return catalogById(id)?.androidPackages ?? [];
}

export const ALL_ANDROID_PACKAGES = CATALOG.flatMap((app) => app.androidPackages);
