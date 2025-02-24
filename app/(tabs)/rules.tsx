import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RulesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How to Play Go Fish</Text>
        
        <Text style={styles.sectionTitle}>Objective</Text>
        <Text style={styles.text}>
          The goal is to collect the most "books" - sets of four cards of the same rank.
        </Text>

        <Text style={styles.sectionTitle}>Game Play</Text>
        <Text style={styles.text}>
          1. Each player starts with 7 cards.
        </Text>
        <Text style={styles.text}>
          2. On your turn, ask the computer for a specific rank of card that you already have in your hand.
        </Text>
        <Text style={styles.text}>
          3. If the computer has the card(s), they must give them all to you. You get another turn.
        </Text>
        <Text style={styles.text}>
          4. If the computer doesn't have the card, they say "Go Fish," and you draw a card from the deck.
        </Text>
        <Text style={styles.text}>
          5. If you draw the card you asked for, you get another turn.
        </Text>

        <Text style={styles.sectionTitle}>Books</Text>
        <Text style={styles.text}>
          When you collect all four cards of the same rank, you automatically form a "book" and place those cards face up on the table.
        </Text>

        <Text style={styles.sectionTitle}>Winning</Text>
        <Text style={styles.text}>
          The game ends when all thirteen books have been collected. The player with the most books wins!
        </Text>

        <Text style={styles.sectionTitle}>Tips</Text>
        <Text style={styles.text}>
          • Keep track of what cards the computer asks for - they probably still need them!
        </Text>
        <Text style={styles.text}>
          • Try to remember what cards have been played.
        </Text>
        <Text style={styles.text}>
          • Focus on completing books where you already have multiple cards of the same rank.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    lineHeight: 24,
  },
});