import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store/gameStore';
import { X, ChevronLeft, Trophy } from 'lucide-react-native';

interface CardProps {
  rank: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  faceDown?: boolean;
  onPress?: () => void;
  style?: any;
  isSelected?: boolean;
  isUserCard?: boolean;
}

function Card({ rank, suit, faceDown, onPress, style, isSelected, isUserCard }: CardProps) {
  const color = suit === 'hearts' || suit === 'diamonds' ? '#DC2626' : '#1E3A8A';
  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }[suit];

  if (faceDown) {
    return (
      <View style={[styles.card, styles.cardBack, style]}>
        <Text style={styles.fishSymbol}>🐟</Text>
      </View>
    );
  }

  return (
    <Pressable 
      style={[
        styles.card, 
        style,
        // Only apply the selected style if it's the user's card
        isSelected && isUserCard && styles.selectedCard
      ]} 
      onPress={onPress}
    >
      <Text style={[styles.cardCorner, { color }]}>
        {rank}
        {suitSymbol}
      </Text>
      <Text style={[styles.cardCenter, { color }]}>
        {rank}
        {'\n'}
        {suitSymbol}
      </Text>
    </Pressable>
  );
}

function PlayerSelection({ onSelect }: { onSelect: (players: number) => void }) {
  return (
    <View style={styles.playerSelection}>
      <Text style={styles.title}>Select Players</Text>
      <View style={styles.playerButtons}>
        {[2, 3, 4].map((num) => (
          <Pressable
            key={num}
            style={styles.playerButton}
            onPress={() => onSelect(num)}
          >
            <Text style={styles.playerButtonText}>{num} Players</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function GameOverModal({ visible, winner, isTie, score, onNewGame }: { 
  visible: boolean; 
  winner: string | null; 
  isTie: boolean;
  score: number;
  onNewGame: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Trophy color="#F59E0B" size={48} style={styles.trophyIcon} />
          <Text style={styles.modalTitle}>Game Over!</Text>
          
          {isTie ? (
            <Text style={styles.modalText}>It's a tie with {score} points!</Text>
          ) : (
            <Text style={styles.modalText}>{winner} wins with {score} points!</Text>
          )}
          
          <Pressable style={styles.newGameButton} onPress={onNewGame}>
            <Text style={styles.newGameButtonText}>New Game</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function Game() {
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const store = useStore();

  useEffect(() => {
    // Only show player selection if there's no existing game
    setShowPlayerSelection(!store.hasExistingGame);
  }, [store.hasExistingGame]);

  // Clear selected card when it's not the user's turn
  useEffect(() => {
    if (store.currentPlayerIndex !== 0) {
      setSelectedCard(null);
    }
  }, [store.currentPlayerIndex]);

  const handlePlayerSelect = (numPlayers: number) => {
    store.initializeGame(numPlayers);
    setShowPlayerSelection(false);
  };

  const handleCardSelect = (rank: string) => {
    // Only allow card selection if it's the user's turn
    if (store.currentPlayerIndex === 0) {
      // Toggle selection if the same card is tapped again
      if (selectedCard === rank) {
        setSelectedCard(null);
      } else {
        setSelectedCard(rank);
      }
    }
  };

  const handlePlayerTargetSelect = async (targetId: number) => {
    if (selectedCard && store.currentPlayerIndex === 0) {
      const gotCard = store.askForCard(0, targetId, selectedCard);
      if (!gotCard) {
        const drawnCard = store.drawCard(0);
        // Wait 3 seconds before computer's turn
        await new Promise(resolve => setTimeout(resolve, 3000));
        store.currentPlayerIndex = (store.currentPlayerIndex + 1) % store.players.length;
        computerTurn();
      }
      setSelectedCard(null);
      setSelectedPlayer(null);
    }
  };

  const computerTurn = async () => {
    const computer = store.players[store.currentPlayerIndex];
    if (!computer?.isComputer) return;

    // Computer selects a random card from their hand
    const randomCard = computer.hand[Math.floor(Math.random() * computer.hand.length)];
    if (!randomCard) return;

    // Computer selects a random player to ask
    const otherPlayers = store.players.filter(p => p.id !== computer.id);
    const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

    // Wait 3 seconds before action
    await new Promise(resolve => setTimeout(resolve, 3000));

    const gotCard = store.askForCard(computer.id, targetPlayer.id, randomCard.rank);
    if (!gotCard) {
      store.drawCard(computer.id, randomCard.rank);
      store.currentPlayerIndex = (store.currentPlayerIndex + 1) % store.players.length;
      
      // Check if it's now the user's turn
      if (store.currentPlayerIndex === 0) {
        store.setYourTurn();
      } else if (store.players[store.currentPlayerIndex].isComputer) {
        // Wait 3 seconds before next computer's turn
        await new Promise(resolve => setTimeout(resolve, 3000));
        computerTurn();
      }
    } else {
      // Computer gets another turn
      await new Promise(resolve => setTimeout(resolve, 3000));
      computerTurn();
    }
  };

  const handleNewGame = () => {
    store.resetGame();
    setShowPlayerSelection(true);
  };

  const renderAskButtons = () => {
    if (!selectedCard || store.currentPlayerIndex !== 0) return null;

    const computerPlayers = store.players.filter(p => p.id !== 0);
    
    return (
      <View style={styles.askButtonsContainer}>
        <Text style={styles.askPrompt}>Ask for {selectedCard}s from:</Text>
        <View style={styles.askButtons}>
          {computerPlayers.map((player) => (
            <Pressable
              key={player.id}
              style={styles.askButton}
              onPress={() => handlePlayerTargetSelect(player.id)}
            >
              <Text style={styles.askButtonText}>{player.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderDeck = () => {
    if (store.deck.length === 0) return null;
    
    return (
      <View style={styles.deckContainer}>
        <Card 
          rank="" 
          suit="hearts" 
          faceDown={true} 
          style={styles.deckCard}
        />
        <Text style={styles.deckCount}>{store.deck.length} cards left</Text>
      </View>
    );
  };

  const renderPlayerHand = (playerId: number, position: 'bottom' | 'left' | 'top' | 'right') => {
    const player = store.players.find(p => p.id === playerId);
    if (!player) return null;

    const containerStyle = {
      bottom: styles.bottomHand,
      left: styles.leftHand,
      top: styles.topHand,
      right: styles.rightHand,
    }[position];

    // Reverse the cards array to display them from right to left
    const cards = [...player.hand].reverse();

    return (
      <View style={[styles.hand, containerStyle]}>
        <Text style={styles.playerName}>{player.name} (Score: {player.score})</Text>
        <View style={styles.cards}>
          {cards.length > 0 ? (
            cards.map((card, index) => (
              <Card
                key={`${card.rank}-${card.suit}-${index}`}
                rank={card.rank}
                suit={card.suit}
                faceDown={player.isComputer}
                onPress={() => !player.isComputer && handleCardSelect(card.rank)}
                style={[
                  styles.cardInHand,
                  { marginRight: index > 0 ? -40 : 0 },
                ]}
                isSelected={selectedCard === card.rank}
                isUserCard={!player.isComputer}
              />
            ))
          ) : (
            <Text style={styles.noCardsText}>No cards</Text>
          )}
        </View>
      </View>
    );
  };

  // If there's no existing game or we're showing player selection, render the player selection screen
  if (showPlayerSelection) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#1E3A8A" size={24} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <PlayerSelection onSelect={handlePlayerSelect} />
      </View>
    );
  }

  // Otherwise, render the game
  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft color="#1E3A8A" size={24} />
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>

      <Text style={styles.lastAction}>{store.lastAction}</Text>

      <View style={styles.gameTable}>
        {renderAskButtons()}
        {renderDeck()}
        {renderPlayerHand(0, 'bottom')}
        {store.players.length > 1 && renderPlayerHand(1, 'top')}
        {store.players.length > 2 && renderPlayerHand(2, 'left')}
        {store.players.length > 3 && renderPlayerHand(3, 'right')}
        
        <GameOverModal 
          visible={store.gameOver} 
          winner={store.winner?.name || null}
          isTie={store.isTie}
          score={store.winner?.score || 0}
          onNewGame={handleNewGame}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F3FF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    marginLeft: 8,
  },
  lastAction: {
    fontSize: 16,
    color: '#1E3A8A',
    textAlign: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  playerSelection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 20,
  },
  playerButtons: {
    gap: 16,
  },
  playerButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    width: 200,
    alignItems: 'center',
  },
  playerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  gameTable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  askButtonsContainer: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  askPrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  askButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  askButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  askButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hand: {
    position: 'absolute',
    alignItems: 'center',
    padding: 20,
  },
  bottomHand: {
    bottom: 0,
    width: '100%',
  },
  topHand: {
    top: 0,
    width: '100%',
  },
  leftHand: {
    left: -160,
    top: '50%',
    transform: [{ rotate: '90deg' }, { translateY: -50 }],
    width: 300,
  },
  rightHand: {
    right: -160,
    top: '50%',
    transform: [{ rotate: '-90deg' }, { translateY: -50 }],
    width: 300,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  cards: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 120,
  },
  card: {
    width: 80,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardBack: {
    backgroundColor: '#3B82F6',
  },
  fishSymbol: {
    fontSize: 32,
  },
  cardInHand: {
    marginHorizontal: -20,
  },
  selectedCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    transform: [{ translateY: -10 }],
  },
  cardCorner: {
    position: 'absolute',
    top: 4,
    left: 4,
    fontSize: 12,
  },
  cardCenter: {
    fontSize: 24,
    textAlign: 'center',
  },
  deckContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckCard: {
    marginBottom: 8,
  },
  deckCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  noCardsText: {
    color: '#64748B',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  trophyIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 18,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 24,
  },
  newGameButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  newGameButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});