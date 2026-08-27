// Expo Push Notification Helper
export async function sendExpoPushNotification({
  pushToken,
  title,
  body,
  data = {},
}: {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
    console.warn('⚠️ Invalid Expo push token:', pushToken);
    return false;
  }

  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await res.json();
    console.log('🚀 [EXPO PUSH SENT]', result);
    return true;
  } catch (error) {
    console.error('❌ Push Notification Error:', error);
    return false;
  }
}
