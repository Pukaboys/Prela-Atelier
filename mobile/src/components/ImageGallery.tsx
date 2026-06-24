import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Colors, Radius } from '../constants/theme';
import type { ProductImage } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  images: ProductImage[];
  mainImagePath: string | null;
}

export default function ImageGallery({ images, mainImagePath }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const allImages = images.length > 0
    ? images
    : mainImagePath
    ? [{ id: 0, path: mainImagePath, alt: null, position: 0 }]
    : [];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const goTo = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  };

  if (allImages.length === 0) {
    return (
      <View style={styles.placeholder}>
        <View style={styles.placeholderInner} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={allImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={{ uri: item.path }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}
      />

      {allImages.length > 1 && (
        <View style={styles.dots}>
          {allImages.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View
                style={[
                  styles.dot,
                  i === activeIndex && styles.dotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.1,
    backgroundColor: Colors.surfaceAlt,
  },
  placeholderInner: {
    flex: 1,
    backgroundColor: Colors.border,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.accent,
  },
});
