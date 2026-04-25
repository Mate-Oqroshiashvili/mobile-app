import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "session_user_id";

export const setCurrentUserId = (id: string) => AsyncStorage.setItem(KEY, id);
export const getCurrentUserId = () => AsyncStorage.getItem(KEY);
export const clearCurrentUserId = () => AsyncStorage.removeItem(KEY);