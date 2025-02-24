import { StyleSheet, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type CardProps = {
  value: string;
  suit: string;
  faceDown?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

export default function Card({ value, suit, faceDown, onPress, disabled }: CardProps) {
  const suitColor = suit === '♥' || suit === '♦' ? '#ff0000' : '#000000';
  
  if (faceDown) {
    return (
      <Pressable 
        onPress={onPress}
        disabled={disabled}
        style={[styles.card, styles.faceDown]}
      >
        <LinearGradient
          colors={['#1e3c72', '#2a5298']}
          style={styles.gradient}
        >
          <Text style={styles.pattern}>🎮</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable 
      onPress={onPress}
      disabled={disabled}
      style={[styles.card, disabled && styles.disabled]}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.value, { color: suitColor }]}>{value}</Text>
        <Text style={[styles.suit, { color: suitColor }]}>{suit}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 60,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  suit: {
    fontSize: 28,
  },
  faceDown: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pattern: {
    fontSize: 24,
    color: '#fff',
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});