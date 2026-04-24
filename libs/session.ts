import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "currentUserId";

export const setCurrentUserId = (id: string) => AsyncStorage.setItem(KEY, id);
export const getCurrentUserId = () => AsyncStorage.getItem(KEY);
export const clearCurrentUserId = () => AsyncStorage.removeItem(KEY);
