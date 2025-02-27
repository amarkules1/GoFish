import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store/gameStore';
import * as StoreReview from 'expo-store-review';
import { Play, Book, Star, History } from 'lucide-react-native';

export default function Home() {
  const store = useStore();
  const hasExistingGame = useStore((state) => state.hasExistingGame);

  const handleNewGame = () => {
    store.hasExistingGame = false;
    router.push('/game');
  };

  const handleResumeGame = () => {
    if (hasExistingGame) {
      router.push('/game');
    }
  };

  const handleRules = () => {
    router.push('/rules');
  };

  const handleRateUs = async () => {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Go Fish</Text>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={handleNewGame}>
          <Play color="#fff" size={24} />
          <Text style={styles.buttonText}>New Game</Text>
        </Pressable>

        <Pressable 
          style={[styles.button, !hasExistingGame && styles.buttonDisabled]} 
          onPress={handleResumeGame}
          disabled={!hasExistingGame}
        >
          <History color="#fff" size={24} />
          <Text style={styles.buttonText}>Resume Game</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={handleRules}>
          <Book color="#fff" size={24} />
          <Text style={styles.buttonText}>Rules</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={handleRateUs}>
          <Star color="#fff" size={24} />
          <Text style={styles.buttonText}>Rate Us</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E6F3FF',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});