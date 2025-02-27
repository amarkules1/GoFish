import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
}

interface Player {
  id: number;
  name: string;
  isComputer: boolean;
  hand: Card[];
  score: number;
}

interface GameState {
  players: Player[];
  deck: Card[];
  currentPlayerIndex: number;
  lastAction: string;
  hasExistingGame: boolean;
  gameOver: boolean;
  winner: Player | null;
  isTie: boolean;
  initializeGame: (numPlayers: number) => void;
  dealCards: () => void;
  drawCard: (playerId: number, targetPlayerId: number, askedRank?: string) => Card | null;
  askForCard: (askingPlayerId: number, targetPlayerId: number, rank: string) => Promise<boolean>;
  checkForPairs: (playerId: number) => void;
  setYourTurn: () => void;
  checkPlayerHand: (playerId: number) => void;
  resetGame: () => void;
}

export const useStore = create<GameState>()(
  persist(
    (set, get) => ({
      players: [],
      deck: [],
      currentPlayerIndex: 0,
      lastAction: '',
      hasExistingGame: false,
      gameOver: false,
      winner: null,
      isTie: false,

      initializeGame: (numPlayers) => {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        const deck = suits.flatMap(suit => 
          ranks.map(rank => ({ suit, rank }))
        );

        // Shuffle deck
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const players = Array(numPlayers).fill(null).map((_, index) => ({
          id: index,
          name: index === 0 ? 'You' : `Computer ${index}`,
          isComputer: index !== 0,
          hand: [],
          score: 0,
        }));

        // Randomly determine who goes first
        const randomFirstPlayer = Math.floor(Math.random() * numPlayers);
        const firstPlayerName = randomFirstPlayer === 0 ? 'You' : `Computer ${randomFirstPlayer}`;
        
        set({ 
          deck,
          players,
          currentPlayerIndex: randomFirstPlayer,
          lastAction: `Game started. ${firstPlayerName} goes first!${randomFirstPlayer === 0 ? ' Your Turn!' : ''}`,
          hasExistingGame: true,
          gameOver: false,
          winner: null,
          isTie: false,
        });

        get().dealCards();
        
        // If a computer goes first, start their turn
        if (randomFirstPlayer !== 0) {
          // Use setTimeout to ensure the game state is fully initialized
          setTimeout(() => {
            const computerTurn = async () => {
              const computer = get().players[get().currentPlayerIndex];
              if (!computer?.isComputer) return;
            
              // Computer selects a random card from their hand
              const randomCard = computer.hand[Math.floor(Math.random() * computer.hand.length)];
              if (!randomCard) return;
            
              // Computer selects a random player to ask
              const otherPlayers = get().players.filter(p => p.id !== computer.id);
              const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
            
              // Wait 3 seconds before action
              await new Promise(resolve => setTimeout(resolve, 2000));
            
              const gotCard = await get().askForCard(computer.id, targetPlayer.id, randomCard.rank);
              if (!gotCard) {
                get().drawCard(computer.id, targetPlayer.id, randomCard.rank);
                set(state => ({
                  currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length
                }));
                
                // Check if it's now the user's turn
                if (get().currentPlayerIndex === 0) {
                  get().setYourTurn();
                } else if (get().players[get().currentPlayerIndex].isComputer) {
                  // Wait 3 seconds before next computer's turn
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  computerTurn();
                }
              } else {
                // Computer gets another turn
                await new Promise(resolve => setTimeout(resolve, 2000));
                computerTurn();
              }
            };
            
            computerTurn();
          }, 1000);
        }
      },

      dealCards: () => {
        const { players, deck } = get();
        const newDeck = [...deck];
        const newPlayers = players.map(player => ({
          ...player,
          hand: newDeck.splice(0, 7),
        }));

        set({ players: newPlayers, deck: newDeck });
        
        // Check for initial pairs
        newPlayers.forEach(player => {
          get().checkForPairs(player.id);
        });
      },

      drawCard: (playerId, targetPlayerId, askedRank) => {
        const { deck, players } = get();
        if (deck.length === 0) return null;

        const newDeck = [...deck];
        const card = newDeck.pop()!;
        
        const newPlayers = players.map(player =>
          player.id === playerId
            ? { ...player, hand: [...player.hand, card] }
            : player
        );

        const player = players.find(p => p.id === playerId)!;
        const targetPlayer = players.find(p => p.id === targetPlayerId)!;
        const message = askedRank 
          ? `${player.name} asked ${targetPlayer.name} for ${askedRank}s - Go Fish! Drew a card.`
          : `${player.name} drew a card`;

        set({ 
          deck: newDeck,
          players: newPlayers,
          lastAction: message,
        });

        // Check for pairs after drawing
        get().checkForPairs(playerId);
        
        // Check if player needs more cards
        get().checkPlayerHand(playerId);
        
        return card;
      },

      askForCard: async (askingPlayerId, targetPlayerId, rank) => {
        const { players } = get();
        const askingPlayer = players.find(p => p.id === askingPlayerId)!;
        const targetPlayer = players.find(p => p.id === targetPlayerId)!;

        const matchingCards = targetPlayer.hand.filter(card => card.rank === rank);
        
        if (matchingCards.length > 0) {
          const newPlayers = players.map(player => {
            if (player.id === askingPlayerId) {
              return {
                ...player,
                hand: [...player.hand, ...matchingCards],
              };
            }
            if (player.id === targetPlayerId) {
              return {
                ...player,
                hand: player.hand.filter(card => card.rank !== rank),
              };
            }
            return player;
          });

          set({
            players: newPlayers,
            lastAction: `${askingPlayer.name} got ${matchingCards.length} ${rank}${matchingCards.length > 2 ? 's' : ''} from ${targetPlayer.name}`,
          });

          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check for pairs after receiving cards
          get().checkForPairs(askingPlayerId);
          
          // Check if target player needs more cards
          get().checkPlayerHand(targetPlayerId);
          
          return true;
        }

        set({
          lastAction: `${askingPlayer.name} asked ${targetPlayer.name} for ${rank}s - Go Fish!`,
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        return false;
      },

      checkForPairs: (playerId) => {
        const { players } = get();
        const player = players.find(p => p.id === playerId)!;
        
        // Count cards by rank
        const rankCounts = player.hand.reduce((acc, card) => {
          acc[card.rank] = (acc[card.rank] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Find ranks with exactly 2 cards (pairs)
        const pairs = Object.entries(rankCounts)
          .filter(([_, count]) => count === 2)
          .map(([rank]) => rank);

        if (pairs.length > 0) {
          const newPlayers = players.map(p => {
            if (p.id === playerId) {
              return {
                ...p,
                // Remove paired cards and keep one of each triple
                hand: p.hand.filter(card => {
                  const count = rankCounts[card.rank];
                  if (count === 2) return false; // Remove pairs
                  if (count === 3) {
                    // Keep only one card for triples
                    rankCounts[card.rank]--;
                    return rankCounts[card.rank] >= 1;
                  }
                  return true;
                }),
                // Add 2 points for each pair
                score: p.score + (pairs.length * 2),
              };
            }
            return p;
          });

          set({
            players: newPlayers,
            lastAction: `${player.name} matched ${pairs.length} pair${pairs.length > 2 ? 's' : ''}  of ${pairs.join(', ')}s!`,
          });
          
          // Check if player needs more cards after matching pairs
          get().checkPlayerHand(playerId);
        }

        // Check if game is over (deck is empty and at least one player has no cards)
        const { deck } = get();
        const updatedPlayers = get().players;
        const allPlayersWithoutCards = updatedPlayers.every(p => p.hand.length === 0);
        
        if (deck.length === 0 && allPlayersWithoutCards) {
          const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score);
          const winner = sortedPlayers[0];
          const isTie = updatedPlayers.filter(p => p.score === winner.score).length > 1;
          
          set({
            lastAction: isTie 
              ? `Game Over! It's a tie with ${winner.score} points!`
              : `Game Over! ${winner.name} wins with ${winner.score} points!`,
            gameOver: true,
            winner: winner,
            isTie: isTie
          });
        }
      },

      setYourTurn: () => {
        set(state => ({
          lastAction: `${state.lastAction} Your Turn!`
        }));
      },
      
      checkPlayerHand: (playerId) => {
        const { players, deck } = get();
        const player = players.find(p => p.id === playerId)!;
        
        // If player has no cards and deck is not empty, draw more cards
        if (player.hand.length === 0 && deck.length > 0) {
          const newDeck = [...deck];
          const cardsToDrawCount = Math.min(7, newDeck.length);
          const cardsToDraw = newDeck.splice(0, cardsToDrawCount);
          
          const newPlayers = players.map(p => {
            if (p.id === playerId) {
              return {
                ...p,
                hand: [...p.hand, ...cardsToDraw],
              };
            }
            return p;
          });
          
          set({
            deck: newDeck,
            players: newPlayers,
            lastAction: `${player.name} ran out of cards and drew ${cardsToDrawCount} new cards.`,
          });
          
          // Check for pairs after drawing new cards
          get().checkForPairs(playerId);
        }
      },
      
      resetGame: () => {
        set({
          players: [],
          deck: [],
          currentPlayerIndex: 0,
          lastAction: '',
          hasExistingGame: false,
          gameOver: false,
          winner: null,
          isTie: false,
        });
      },
    }),
    {
      name: 'go-fish-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        players: state.players,
        deck: state.deck,
        currentPlayerIndex: state.currentPlayerIndex,
        lastAction: state.lastAction,
        hasExistingGame: state.hasExistingGame,
        gameOver: state.gameOver,
        winner: state.winner,
        isTie: state.isTie,
      }),
    }
  )
);