import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Card from '../../components/Card';
import {
  Card as CardType,
  Player,
  createDeck,
  dealCards,
  checkForBooks,
  removeBooks,
  hasCard,
  transferCards,
  drawCard,
  computerPickValue,
} from '../../utils/gameLogic';

export default function GameScreen() {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [player, setPlayer] = useState<Player>({ hand: [], books: [] });
  const [computer, setComputer] = useState<Player>({ hand: [], books: [] });
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [message, setMessage] = useState<string>('');
  const [gameOver, setGameOver] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(true);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const newDeck = createDeck();
    const { playerHand, computerHand, remainingDeck } = dealCards(newDeck);

    const playerBooks = checkForBooks(playerHand);
    const computerBooks = checkForBooks(computerHand);

    setPlayer({
      hand: removeBooks(playerHand, playerBooks),
      books: playerBooks,
    });
    setComputer({
      hand: removeBooks(computerHand, computerBooks),
      books: computerBooks,
    });
    setDeck(remainingDeck);
    setSelectedCard(null);
    setMessage('Your turn! Select a card to ask for.');
    setGameOver(false);
    setPlayerTurn(true);
  };

  const handleCardSelect = (card: CardType) => {
    if (!playerTurn || gameOver) return;
    setSelectedCard(card);
    setMessage(`Ask computer for ${card.value}s`);
  };

  const handleAskForCard = async () => {
    if (!selectedCard || !playerTurn || gameOver) return;

    if (hasCard(computer.hand, selectedCard.value)) {
      const { fromHand, toHand } = transferCards(
        computer.hand,
        player.hand,
        selectedCard.value
      );

      setComputer({ ...computer, hand: fromHand });
      const newPlayerHand = toHand;
      const newBooks = checkForBooks(newPlayerHand);
      
      setPlayer({
        hand: removeBooks(newPlayerHand, newBooks),
        books: [...player.books, ...newBooks],
      });

      setMessage(`Got ${selectedCard.value}(s) from computer!`);
    } else {
      setMessage('Go Fish!');
      const { card, remainingDeck } = drawCard(deck);
      if (card) {
        const newHand = [...player.hand, card];
        const newBooks = checkForBooks(newHand);
        setPlayer({
          hand: removeBooks(newHand, newBooks),
          books: [...player.books, ...newBooks],
        });
        setDeck(remainingDeck);
      }
      setPlayerTurn(false);
      setTimeout(computerTurn, 1500);
    }

    setSelectedCard(null);
    checkGameOver();
  };

  const computerTurn = () => {
    if (gameOver) return;

    const requestedValue = computerPickValue(computer.hand, player.hand);
    setMessage(`Computer asks for ${requestedValue}s`);

    setTimeout(() => {
      if (hasCard(player.hand, requestedValue)) {
        const { fromHand, toHand } = transferCards(
          player.hand,
          computer.hand,
          requestedValue
        );

        setPlayer({ ...player, hand: fromHand });
        const newComputerHand = toHand;
        const newBooks = checkForBooks(newComputerHand);

        setComputer({
          hand: removeBooks(newComputerHand, newBooks),
          books: [...computer.books, ...newBooks],
        });

        setMessage(`Computer took your ${requestedValue}(s)!`);
        setTimeout(computerTurn, 1500);
      } else {
        setMessage('Computer goes fishing!');
        const { card, remainingDeck } = drawCard(deck);
        if (card) {
          const newHand = [...computer.hand, card];
          const newBooks = checkForBooks(newHand);
          setComputer({
            hand: removeBooks(newHand, newBooks),
            books: [...computer.books, ...newBooks],
          });
          setDeck(remainingDeck);
        }
        setPlayerTurn(true);
        setMessage('Your turn!');
      }
      checkGameOver();
    }, 1500);
  };

  const checkGameOver = () => {
    if (
      (player.hand.length === 0 && computer.hand.length === 0) ||
      deck.length === 0
    ) {
      setGameOver(true);
      const playerScore = player.books.length;
      const computerScore = computer.books.length;
      if (playerScore > computerScore) {
        setMessage(`Game Over! You win ${playerScore}-${computerScore}!`);
      } else if (computerScore > playerScore) {
        setMessage(`Game Over! Computer wins ${computerScore}-${playerScore}!`);
      } else {
        setMessage(`Game Over! It's a tie ${playerScore}-${computerScore}!`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.computerSection}>
        <Text style={styles.sectionTitle}>Computer's Hand</Text>
        <View style={styles.cardContainer}>
          {computer.hand.map((_, index) => (
            <Card
              key={index}
              value=""
              suit=""
              faceDown
            />
          ))}
        </View>
        <Text style={styles.books}>
          Books: {computer.books.join(', ') || 'None'}
        </Text>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.deckArea}>
          <Text style={styles.deckCount}>Cards in deck: {deck.length}</Text>
          {deck.length > 0 && (
            <Card value="" suit="" faceDown />
          )}
        </View>
        {gameOver && (
          <Pressable style={styles.button} onPress={startNewGame}>
            <Text style={styles.buttonText}>New Game</Text>
          </Pressable>
        )}
        {selectedCard && !gameOver && (
          <Pressable style={styles.button} onPress={handleAskForCard}>
            <Text style={styles.buttonText}>Ask for Card</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.playerSection}>
        <Text style={styles.books}>
          Books: {player.books.join(', ') || 'None'}
        </Text>
        <Text style={styles.sectionTitle}>Your Hand</Text>
        <View style={styles.cardContainer}>
          {player.hand.map((card, index) => (
            <Card
              key={index}
              value={card.value}
              suit={card.suit}
              onPress={() => handleCardSelect(card)}
              disabled={!playerTurn || gameOver}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    paddingTop: 40,
  },
  computerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  middleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  message: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 10,
    padding: 10,
  },
  books: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
  deckArea: {
    alignItems: 'center',
    marginVertical: 10,
  },
  deckCount: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});