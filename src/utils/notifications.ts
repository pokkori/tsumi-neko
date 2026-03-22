import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function scheduleDailyReminderAsync(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ずんぐりネコが待っている…',
      body: '今日のスタックを積んでずんぐりネコを召喚しよう！',
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
}
