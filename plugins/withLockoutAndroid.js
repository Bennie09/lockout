const { withAndroidManifest } = require('@expo/config-plugins');

const PACKAGES = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',
  'com.ss.android.ugc.trill',
  'com.google.android.youtube',
  'com.twitter.android',
  'com.snapchat.android',
  'com.facebook.katana',
  'com.facebook.lite',
  'com.reddit.frontpage',
  'com.whatsapp',
  'com.whatsapp.w4b',
  'com.discord',
  'com.pinterest',
];

function withLockoutAndroid(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.$) manifest.$ = {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (!manifest.queries) manifest.queries = [{}];
    const queries = manifest.queries[0];
    const existing = new Set(
      (queries.package || []).map((item) => item.$?.['android:name']).filter(Boolean),
    );
    queries.package = queries.package || [];
    for (const name of PACKAGES) {
      if (existing.has(name)) continue;
      queries.package.push({ $: { 'android:name': name } });
    }
    return config;
  });
}

module.exports = withLockoutAndroid;
