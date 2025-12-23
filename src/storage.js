import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveAppsToStorage = async (sectionNum, data) => {
  try {
    const existingData = await AsyncStorage.getItem('launcher_apps');
    let json = existingData ? JSON.parse(existingData) : { section1: [], section2: [] };
    
    if (sectionNum === 1) {
      json.section1 = data;
    } else {
      json.section2 = data;
    }

    await AsyncStorage.setItem('launcher_apps', JSON.stringify(json));
  } catch (e) {
    console.error("Erro ao salvar apps", e);
  }
};

export const loadAppsFromStorage = async () => {
  try {
    const data = await AsyncStorage.getItem('launcher_apps');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        section1: parsed.section1 || [],
        section2: parsed.section2 || []
      };
    }
    return { section1: [], section2: [] };
  } catch (e) {
    console.error("Erro ao carregar apps", e);
    return { section1: [], section2: [] };
  }
};