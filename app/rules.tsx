import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

export default function Rules() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rules</Text>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <X color="#1E3A8A" size={24} />
        </Pressable>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.section}>Objective</Text>
        <Text style={styles.text}>
          The goal is to collect the most sets of four cards of the same rank (four 7s, four Kings, etc.).
        </Text>

        <Text style={styles.section}>Setup</Text>
        <Text style={styles.text}>
          • 2-4 players can play{'\n'}
          • Each player is dealt 7 cards{'\n'}
          • Remaining cards form the "fish pond"
        </Text>

        <Text style={styles.section}>Gameplay</Text>
        <Text style={styles.text}>
          1. On your turn, ask one player for a specific card rank that you already have in your hand{'\n\n'}
          2. If they have the card(s), they must give them all to you{'\n\n'}
          3. If they don't have any cards of that rank, they say "Go fish!" and you draw one card from the pond{'\n\n'}
          4. If you get what you asked for (either from a player or the pond), you get another turn{'\n\n'}
          5. Whenever you collect all four cards of a rank, you score a point and remove those cards from play
        </Text>

        <Text style={styles.section}>Winning</Text>
        <Text style={styles.text}>
          The game ends when all sets have been collected. The player with the most sets wins!
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F3FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
});