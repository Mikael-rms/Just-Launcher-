import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, 
  StatusBar, TextInput, FlatList, Alert, Modal, 
  Linking, PanResponder, Keyboard, TouchableWithoutFeedback, Animated
} from 'react-native';

import { InstalledApps, AppLauncher } from 'react-native-launcher-kit'; 
import { saveAppsToStorage, loadAppsFromStorage } from './src/storage';

export default function App() {
  const [allApps, setAllApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [section1, setSection1] = useState([]); 
  const [section2, setSection2] = useState([]);
  const [currentSection, setCurrentSection] = useState(1);
  const [searchVisible, setSearchVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSelectingApps, setIsSelectingApps] = useState(false);

  // Valor animado para a transição entre secções
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const init = async () => {
      const apps = InstalledApps.getSortedApps() || []; 
      setAllApps(apps);
      setFilteredApps(apps);
      const saved = await loadAppsFromStorage();
      setSection1(saved?.section1 || []);
      setSection2(saved?.section2 || []);
    };
    init();
  }, []);

  const switchSection = (target) => {
    if (currentSection === target) return;
    
    // Animação de saída, troca de estado e entrada
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentSection(target);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -50) switchSection(2); // Deslizar para cima -> Secção 2
        if (g.dy > 50) switchSection(1);  // Deslizar para baixo -> Secção 1
      },
    })
  ).current;

  const openApp = (packageName) => {
    if (packageName) {
      AppLauncher.launchApp(packageName); 
      setSearchVisible(false);
      setSearchQuery('');
    }
  };

  const toggleAppSelection = (app) => {
    const target = currentSection === 1 ? [...section1] : [...section2];
    const index = target.findIndex(item => item.packageName === app.packageName);

    if (index > -1) {
      target.splice(index, 1);
    } else {
      if (target.length >= 6) return Alert.alert("limite", "máximo de 6 apps");
      target.push({ label: app.label.toLowerCase(), packageName: app.packageName });
    }

    if (currentSection === 1) { setSection1(target); saveAppsToStorage(1, target); }
    else { setSection2(target); saveAppsToStorage(2, target); }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <TouchableOpacity 
        activeOpacity={1} 
        onLongPress={() => setMenuVisible(true)} 
        style={styles.homeLayout}
      >
        <Animated.View style={[styles.appGroup, { opacity: fadeAnim }]}>
          {(currentSection === 1 ? section1 : section2).map((app, i) => (
            <TouchableOpacity key={i} onPress={() => openApp(app.packageName)} style={styles.itemBtn}>
              <Text style={styles.itemText}>{app.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <TouchableOpacity style={styles.searchIconBtn} onPress={() => setSearchVisible(true)}>
          <Text style={styles.searchLabel}>search</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Menu de Contexto */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <View style={styles.menuContent}>
              <TouchableOpacity onPress={() => { setMenuVisible(false); setIsSelectingApps(true); setSearchVisible(true); }}>
                <Text style={styles.menuItem}>escolher apps da tela inicial</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert("ordenar", "mantenha pressionado para arrastar (brevemente)")}>
                <Text style={styles.menuItem}>ordenar apps na tela inicial</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal de Busca */}
      <Modal visible={searchVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => { setSearchVisible(false); setIsSelectingApps(false); setSearchQuery(''); Keyboard.dismiss(); }}>
          <View style={styles.searchModal}>
            <TextInput
              style={styles.iosInput}
              placeholder="procurar"
              placeholderTextColor="#555"
              autoFocus={true}
              caretHidden={true}
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                setFilteredApps(allApps.filter(a => a.label.toLowerCase().includes(t.toLowerCase())));
              }}
            />
            <FlatList
              data={filteredApps}
              keyExtractor={(item) => item.packageName}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = (currentSection === 1 ? section1 : section2).some(s => s.packageName === item.packageName);
                return (
                  <TouchableOpacity 
                    style={styles.resItem} 
                    onPress={() => isSelectingApps ? toggleAppSelection(item) : openApp(item.packageName)}
                  >
                    <Text style={[styles.resText, isSelected && { color: '#007AFF' }]}>
                      {item.label.toLowerCase()} {isSelected && " ✓"}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  homeLayout: { flex: 1, paddingLeft: 60, justifyContent: 'center' },
  appGroup: { height: 350, justifyContent: 'center' },
  itemBtn: { paddingVertical: 10 },
  itemText: { color: '#fff', fontSize: 24, fontFamily: 'sans-serif-light', fontWeight: '300' },
  
  searchIconBtn: { position: 'absolute', bottom: 60, left: 60 },
  searchLabel: { color: '#333', fontSize: 16, fontFamily: 'sans-serif-light' },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  menuContent: { backgroundColor: '#1c1c1e', padding: 20, borderRadius: 24, width: '85%' },
  menuItem: { color: '#fff', fontSize: 18, paddingVertical: 18, textAlign: 'center', fontFamily: 'sans-serif-light' },

  searchModal: { flex: 1, backgroundColor: '#000', paddingLeft: 60, paddingTop: 100 },
  iosInput: { color: '#fff', fontSize: 28, fontFamily: 'sans-serif-light', marginBottom: 20 },
  resItem: { paddingVertical: 14 },
  resText: { color: '#fff', fontSize: 19, fontFamily: 'sans-serif-light' }
}); 