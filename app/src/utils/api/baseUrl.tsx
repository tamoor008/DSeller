// import remoteConfig from '@react-native-firebase/remote-config';

// let BASE_URL = 'https://fallback-url.com'; // default

// export const initializeBaseUrl = async () => {
//   try {
//     await remoteConfig().setDefaults({
//       base_url: BASE_URL,
//     });

//     await remoteConfig().fetchAndActivate();

//     const fetchedUrl = remoteConfig().getValue('Base_URL').asString();
//     console.log(fetchedUrl,'fetchedUrl');
    

//     if (fetchedUrl) {
//       BASE_URL = fetchedUrl;
//       console.log('✅ Fetched BASE_URL from Firebase:', BASE_URL);
//     }
//   } catch (error) {
//     console.error('❌ Failed to fetch BASE_URL from Firebase:', error);
//   }
// };

// export const getBaseUrl = () => BASE_URL;


import { getRemoteConfig } from '@react-native-firebase/remote-config';

let BASE_URL = 'https://fallback-url.com'; // default

export const initializeBaseUrl = async () => {
  try {
    const remoteConfig = getRemoteConfig();
    await remoteConfig.setDefaults({
      base_url: BASE_URL,
    });

    // Set settings to avoid caching during development
    await remoteConfig.setConfigSettings({
      minimumFetchIntervalMillis: 0, // always fetch fresh config
    });

    await remoteConfig.fetchAndActivate();

    const fetchedUrl = remoteConfig.getValue('Base_URL').asString();
    console.log(fetchedUrl, 'fetchedUrl');

    if (fetchedUrl) {
      BASE_URL = fetchedUrl;
      console.log('✅ Fetched BASE_URL from Firebase:', BASE_URL);
    }
  } catch (error) {
    console.log('❌ Failed to fetch BASE_URL from Firebase:', error);
  }
};

export const getBaseUrl = () => BASE_URL;
