import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeSingleData = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.log(error);
  }
};

export const storeObjectData = async (key: string, value: object) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.log(error);
  }
};

export const getSingleData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  } catch (error) {
    console.log(error);
  }
};

export const getObjectData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return JSON.parse(value);
    }
  } catch (error) {
    console.log(error);
  }
};

export const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log(error);
  }
};

export const updateData = async (key: string, value: string) => {
  try {
    await AsyncStorage.mergeItem(key, value);
  } catch (error) {
    console.log(error);
  }
};
