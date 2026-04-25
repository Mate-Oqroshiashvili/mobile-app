import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'step_academy_session';
// სესიის ხანგრძლივობა: 1 საათი (მილიწამებში)
const SESSION_DURATION_MS = 60 * 60 * 1000; 

// 1. მომხმარებლის აიდის და სესიის ვადის შენახვა ლოგინის დროს
export async function setCurrentUserId(userId: string) {
  try {
    const expiry = Date.now() + SESSION_DURATION_MS;
    const sessionData = JSON.stringify({ userId, expiry });
    await AsyncStorage.setItem(SESSION_KEY, sessionData);
  } catch (e) {
    console.error("სესიის შენახვის შეცდომა:", e);
  }
}

// 2. მიმდინარე მომხმარებლის წამოღება და ვადის შემოწმება
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const dataStr = await AsyncStorage.getItem(SESSION_KEY);
    if (!dataStr) return null;

    const sessionData = JSON.parse(dataStr);

    // ვამოწმებთ, ხომ არ გაუვიდა ვადა (1 საათი ხომ არ გავიდა)
    if (Date.now() > sessionData.expiry) {
      await clearCurrentUserId(); // თუ ვადა გაუვიდა, ვშლით სესიას
      return null;
    }

    // (სურვილისამებრ) სესიის განახლება: ყოველ აპლიკაციაში შესვლაზე ვადა კიდევ 1 საათით უხანგრძლივდება
    // const newExpiry = Date.now() + SESSION_DURATION_MS;
    // await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: sessionData.userId, expiry: newExpiry }));

    return sessionData.userId;
  } catch (e) {
    console.error("სესიის წამოღების შეცდომა:", e);
    return null;
  }
}

// 3. სესიის გასუფთავება (ლოგაუთის დროს)
export async function clearCurrentUserId() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error("სესიის წაშლის შეცდომა:", e);
  }
}