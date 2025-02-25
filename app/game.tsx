import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store/gameStore';
import { X, ChevronLeft } from 'lucide-react-native';

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

export default function Game() {
  const [showPlayerSelection, setShowPlayerSelection] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const store = useStore();

  useEffect(() => {
    if (!store.hasExistingGame) {
      setShowPlayerSelection(true);
    }
  }, [store.hasExistingGame]);

  const handlePlayerSelect = (numPlayers: number) => {
    store.initializeGame(numPlayers);
    setShowPlayerSelection(false);
  };

  const handleCardSelect = (rank: string) => {
    setSelectedCard(rank);
  };

  const handlePlayerTargetSelect = async (targetId: number) => {
    if (selectedCard && store.currentPlayerIndex === 0) {
      const gotCard = store.askForCard(0, targetId, selectedCard);
      if (!gotCard) {
        const drawnCard = store.drawCard(0);
        // Wait 3 seconds before computer's turn
        await new Promise(resolve => setTimeout(resolve, 3000));
        store.currentPlayerIndex = 1;
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
      if (store.players[store.currentPlayerIndex].isComputer) {
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
          {cards.map((card, index) => (
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
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft color="#1E3A8A" size={24} />
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>

      <Text style={styles.lastAction}>{store.lastAction}</Text>

      {showPlayerSelection ? (
        <PlayerSelection onSelect={handlePlayerSelect} />
      ) : (
        <View style={styles.gameTable}>
          {renderAskButtons()}
          {renderPlayerHand(0, 'bottom')}
          {store.players.length > 1 && renderPlayerHand(1, 'top')}
          {store.players.length > 2 && renderPlayerHand(2, 'left')}
          {store.players.length > 3 && renderPlayerHand(3, 'right')}
        </View>
      )}
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
    width: '100%',
    padding: 20,
  },
  bottomHand: {
    bottom: 0,
  },
  topHand: {
    top: 0,
  },
  leftHand: {
    left: 0,
    transform: [{ rotate: '90deg' }],
  },
  rightHand: {
    right: 0,
    transform: [{ rotate: '-90deg' }],
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
});