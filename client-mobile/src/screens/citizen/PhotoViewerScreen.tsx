import { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoViewer'>;

const { width } = Dimensions.get('window');

// S7.3 — swipeable full-screen viewer shared by complaint evidence and resolution proof;
// closing returns to the detail screen's same scroll position since this is just an overlay.
export function PhotoViewerScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { urls, startIndex } = route.params;
  const [index, setIndex] = useState(startIndex);
  const listRef = useRef<FlatList<string>>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  function go(delta: number) {
    const next = Math.max(0, Math.min(urls.length - 1, index + delta));
    listRef.current?.scrollToIndex({ index: next });
  }

  return (
    <View style={styles.wrap}>
      <SafeAreaView style={styles.topBar}>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <X size={22} color="#fff" />
        </Pressable>
        <Text style={styles.topLabel}>{t('photoViewer.photoOf', { current: index + 1, total: urls.length })}</Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      <FlatList
        ref={listRef}
        data={urls}
        keyExtractor={(url) => url}
        horizontal
        pagingEnabled
        initialScrollIndex={startIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
          </View>
        )}
      />

      <View style={styles.bottomBar}>
        <Pressable style={styles.navButton} onPress={() => go(-1)} disabled={index === 0}>
          <ChevronLeft size={20} color="#fff" />
        </Pressable>
        <View style={styles.dots}>
          {urls.map((url, i) => (
            <View key={url} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.navButton} onPress={() => go(1)} disabled={index === urls.length - 1}>
          <ChevronRight size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0A0E12' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topLabel: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 14, fontFamily: fonts.sansExtraBold },
  page: { width, alignItems: 'center', justifyContent: 'center' },
  image: { width, height: '100%' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 },
  navButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff' },
});
