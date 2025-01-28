import { ReactElement } from "react";
import KingDark from "../assets/pieces/king_dark.svg?react";
import QueenDark from "../assets/pieces/queen_dark.svg?react";
import RookDark from "../assets/pieces/rook_dark.svg?react";
import BishopDark from "../assets/pieces/bishop_dark.svg?react";
import KnightDark from "../assets/pieces/knight_dark.svg?react";
import PawnDark from "../assets/pieces/pawn_dark.svg?react";
import KingLight from "../assets/pieces/king_light.svg?react";
import QueenLight from "../assets/pieces/queen_light.svg?react";
import RookLight from "../assets/pieces/rook_light.svg?react";
import BishopLight from "../assets/pieces/bishop_light.svg?react";
import KnightLight from "../assets/pieces/knight_light.svg?react";
import PawnLight from "../assets/pieces/pawn_light.svg?react";

const pieceSprites: { [key: string]: ReactElement } = {
	k: <KingDark className='piece' />,
	q: <QueenDark className='piece' />,
	r: <RookDark className='piece' />,
	b: <BishopDark className='piece' />,
	n: <KnightDark className='piece' />,
	p: <PawnDark className='piece' />,
	K: <KingLight className='piece' />,
	Q: <QueenLight className='piece' />,
	R: <RookLight className='piece' />,
	B: <BishopLight className='piece' />,
	N: <KnightLight className='piece' />,
	P: <PawnLight className='piece' />,
};

function isLegalPawnMove(
	from: string,
	to: string,
	whitesTurn: boolean,
	boardState: { [key: string]: string | null },
	enPassantTarget: string | null
): boolean {
	const fromFile = from.charAt(0);
	const fromRank = parseInt(from.charAt(1));
	const toFile = to.charAt(0);
	const toRank = parseInt(to.charAt(1));
	const fileDiff = Math.abs(toFile.charCodeAt(0) - fromFile.charCodeAt(0));
	const rankDiff = whitesTurn ? toRank - fromRank : fromRank - toRank;
	const targetPiece = boardState[to];

	// Basic pawn movement
	if (fileDiff === 0) {
		// Forward movement - ensure no piece is blocking
		if (
			targetPiece === null &&
			(Math.abs(rankDiff) === 1 ||
				(((whitesTurn && fromRank === 2) ||
					(!whitesTurn && fromRank === 7)) &&
					Math.abs(rankDiff) === 2))
		) {
			return true;
		}
	} else if (fileDiff === 1 && rankDiff === 1) {
		// Regular diagonal capture
		if (targetPiece !== null) {
			const isWhitePiece = targetPiece === targetPiece.toUpperCase();
			return whitesTurn ? !isWhitePiece : isWhitePiece;
		}
		// En passant capture
		if (to === enPassantTarget) {
			return true;
		}
	}
	return false;
}

function isLegalRookMove(from: string, to: string, boardState: { [key: string]: string | null }): boolean {
	const fromFile = from.charAt(0);
	const fromRank = parseInt(from.charAt(1));
	const toFile = to.charAt(0);
	const toRank = parseInt(to.charAt(1));

	// Rook moves either horizontally or vertically
	if (!(fromFile === toFile || fromRank === toRank)) return false;

	// Check for pieces blocking the path
	if (fromFile === toFile) {
		// Vertical movement
		const start = Math.min(fromRank, toRank);
		const end = Math.max(fromRank, toRank);
		for (let rank = start + 1; rank < end; rank++) {
			if (boardState[`${fromFile}${rank}`] !== null) return false;
		}
	} else {
		// Horizontal movement
		const start = Math.min(fromFile.charCodeAt(0), toFile.charCodeAt(0));
		const end = Math.max(fromFile.charCodeAt(0), toFile.charCodeAt(0));
		for (let file = start + 1; file < end; file++) {
			if (boardState[`${String.fromCharCode(file)}${fromRank}`] !== null) return false;
		}
	}

	return true;
}

function isLegalKnightMove(from: string, to: string): boolean {
	const fromFile = from.charAt(0);
	const fromRank = parseInt(from.charAt(1));
	const toFile = to.charAt(0);
	const toRank = parseInt(to.charAt(1));
	const fileDiff = Math.abs(toFile.charCodeAt(0) - fromFile.charCodeAt(0));
	const rankDiff = Math.abs(toRank - fromRank);

	// Knight moves in L-shape: 2 squares in one direction and 1 square perpendicular
	return (
		(fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2)
	);
}

function isLegalBishopMove(from: string, to: string, boardState: { [key: string]: string | null }): boolean {
	const fromFile = from.charAt(0);
	const fromRank = parseInt(from.charAt(1));
	const toFile = to.charAt(0);
	const toRank = parseInt(to.charAt(1));
	const fileDiff = Math.abs(toFile.charCodeAt(0) - fromFile.charCodeAt(0));
	const rankDiff = Math.abs(toRank - fromRank);

	// Bishop moves diagonally (equal movement in both directions)
	if (fileDiff !== rankDiff) return false;

	// Check for pieces blocking the diagonal path
	const fileDirection = toFile.charCodeAt(0) > fromFile.charCodeAt(0) ? 1 : -1;
	const rankDirection = toRank > fromRank ? 1 : -1;

	let currentFile = fromFile.charCodeAt(0);
	let currentRank = fromRank;

	// Move one step at a time until we reach the target square
	while (true) {
		currentFile += fileDirection;
		currentRank += rankDirection;

		// Stop if we've reached the target square
		if (currentFile === toFile.charCodeAt(0) && currentRank === toRank) break;

		// Check if the path is blocked
		if (boardState[`${String.fromCharCode(currentFile)}${currentRank}`] !== null) {
			return false;
		}
	}

	return true;
}

function isLegalQueenMove(from: string, to: string, boardState: { [key: string]: string | null }): boolean {
	// Queen combines rook and bishop movements
	return isLegalRookMove(from, to, boardState) || isLegalBishopMove(from, to, boardState);
}

function isLegalKingMove(from: string, to: string, boardState: { [key: string]: string | null }, castlingStates: { white: { kingSide: boolean, queenSide: boolean }, black: { kingSide: boolean, queenSide: boolean } }): boolean {
	const fromFile = from.charAt(0);
	const fromRank = parseInt(from.charAt(1));
	const toFile = to.charAt(0);
	const toRank = parseInt(to.charAt(1));
	const fileDiff = Math.abs(toFile.charCodeAt(0) - fromFile.charCodeAt(0));
	const rankDiff = Math.abs(toRank - fromRank);

	// Regular king move
	if (fileDiff <= 1 && rankDiff <= 1) return true;

	// Check for castling
	if (rankDiff === 0 && fromFile === 'e') {
		const isWhite = fromRank === 1;
		if (fromRank !== (isWhite ? 1 : 8)) return false;

		const castlingRights = isWhite ? castlingStates.white : castlingStates.black;

		// Kingside castling
		if (toFile === 'g' && castlingRights.kingSide) {
			const rookSquare = `h${fromRank}`;
			if (boardState[rookSquare] === (isWhite ? 'R' : 'r') &&
				boardState[`f${fromRank}`] === null &&
				boardState[`g${fromRank}`] === null) {
				// Check if squares between king and rook are attacked
				if (!isSquareAttacked(`f${fromRank}`, !isWhite, boardState) &&
					!isSquareAttacked(`g${fromRank}`, !isWhite, boardState)) {
					return true;
				}
			}
		}

		// Queenside castling
		if (toFile === 'c' && castlingRights.queenSide) {
			const rookSquare = `a${fromRank}`;
			if (boardState[rookSquare] === (isWhite ? 'R' : 'r') &&
				boardState[`b${fromRank}`] === null &&
				boardState[`c${fromRank}`] === null &&
				boardState[`d${fromRank}`] === null) {
				// Check if squares between king and rook are attacked
				if (!isSquareAttacked(`c${fromRank}`, !isWhite, boardState) &&
					!isSquareAttacked(`d${fromRank}`, !isWhite, boardState)) {
					return true;
				}
			}
		}
	}

	return false;
}

function findKing(
	boardState: { [key: string]: string | null },
	isWhiteKing: boolean
): string | null {
	for (const [position, piece] of Object.entries(boardState)) {
		if (piece === (isWhiteKing ? "K" : "k")) {
			return position;
		}
	}
	return null;
}

function isSquareAttacked(
	square: string,
	byWhite: boolean,
	boardState: { [key: string]: string | null }
): boolean {
	for (const [position, piece] of Object.entries(boardState)) {
		if (!piece) continue;
		const isPieceWhite = piece === piece.toUpperCase();
		if (isPieceWhite === byWhite) {
			switch (piece.toUpperCase()) {
				case "P":
					// Pawns attack diagonally
					if (
						isLegalPawnMove(
							position,
							square,
							isPieceWhite,
							boardState,
							null
						)
					)
						return true;
					break;
				case "R":
					if (isLegalRookMove(position, square, boardState)) return true;
					break;
				case "N":
					if (isLegalKnightMove(position, square)) return true;
					break;
				case "B":
					if (isLegalBishopMove(position, square, boardState)) return true;
					break;
				case "Q":
					if (isLegalQueenMove(position, square, boardState)) return true;
					break;
				case "K":
					if (isLegalKingMove(position, square, boardState, { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } })) return true;
					break;
			}
		}
	}
	return false;
}

function isKingInCheck(
	boardState: { [key: string]: string | null },
	whiteKing: boolean
): boolean {
	const kingPosition = findKing(boardState, whiteKing);
	if (!kingPosition) return false; // Should never happen in a valid game
	return isSquareAttacked(kingPosition, !whiteKing, boardState);
}

function wouldMoveExposeKing(
	from: string,
	to: string,
	piece: string,
	boardState: { [key: string]: string | null }
): boolean {
	// Simulate the move
	const newBoardState = { ...boardState };
	newBoardState[to] = piece;
	newBoardState[from] = null;

	// Check if the king would be in check after the move
	return isKingInCheck(newBoardState, piece === piece.toUpperCase());
}

export function isLegalMove(
	whitesTurn: boolean,
	piece: string,
	from: string,
	to: string,
	boardState: { [key: string]: string | null },
	enPassantTarget: string | null = null,
	castlingStates: { white: { kingSide: boolean, queenSide: boolean }, black: { kingSide: boolean, queenSide: boolean } } = {
		white: { kingSide: true, queenSide: true },
		black: { kingSide: true, queenSide: true }
	}
): boolean {
	// Validate input coordinates
	if (!from.match(/^[a-h][1-8]$/) || !to.match(/^[a-h][1-8]$/)) return false;

	// Early return if moving to the same square
	if (from === to) return false;

	// Early return if target square has a piece of the same color
	const targetPiece = boardState[to];
	if (targetPiece) {
		const isTargetWhite = targetPiece === targetPiece.toUpperCase();
		const isMovingPieceWhite = piece === piece.toUpperCase();
		if (isTargetWhite === isMovingPieceWhite) return false;
	}

	// Check if it's the correct player's turn
	if ((whitesTurn && piece === piece.toLowerCase()) ||
		(!whitesTurn && piece === piece.toUpperCase())) {
		return false;
	}

	
	

	// Check basic piece movement
	let isBasicMoveValid = false;
	switch (piece.toUpperCase()) {
		case "P":
			isBasicMoveValid = isLegalPawnMove(
				from,
				to,
				whitesTurn,
				boardState,
				enPassantTarget
			);
			break;
		case "R":
			isBasicMoveValid = isLegalRookMove(from, to, boardState);
			break;
		case "N":
			isBasicMoveValid = isLegalKnightMove(from, to);
			break;
		case "B":
			isBasicMoveValid = isLegalBishopMove(from, to, boardState);
			break;
		case "Q":
			isBasicMoveValid = isLegalQueenMove(from, to, boardState);
			break;
		case "K":
			isBasicMoveValid = isLegalKingMove(from, to, boardState, castlingStates);
			break;
		default:
			return false;
	}

	if (!isBasicMoveValid) return false;

	// Check if the move would expose the king to check
	return !wouldMoveExposeKing(from, to, piece, boardState);
}

export function isCheckmate(
	boardState: { [key: string]: string | null },
	whitesTurn: boolean,
	enPassantTarget: string | null,
	castlingStates: { white: { kingSide: boolean, queenSide: boolean }, black: { kingSide: boolean, queenSide: boolean } },
	pieceState: {[color:string]:{[piece: string]: string[]}}
): { isCheckmate: boolean, isDraw: boolean } {
	// First check if the king is in check
	const isInCheck = isKingInCheck(boardState, whitesTurn);
	const hasAnyLegalMove = hasLegalMoves(boardState, whitesTurn, enPassantTarget, castlingStates);

	if (!isInCheck) {
		// If not in check and no legal moves, it's stalemate
		if (!hasAnyLegalMove) {
			return { isCheckmate: false, isDraw: true };
		}

		// Check for insufficient material
		const currentColor = whitesTurn ? 'white' : 'black';
		const opponentColor = whitesTurn ? 'black' : 'white';
		const currentPieces = pieceState[currentColor];
		const opponentPieces = pieceState[opponentColor];

		// Count total pieces for each side
		const currentPieceCount = Object.values(currentPieces).flat().length;
		const opponentPieceCount = Object.values(opponentPieces).flat().length;

		// Insufficient material cases
		const isInsufficientMaterial = (() => {
			// King vs King
			if (currentPieceCount === 1 && opponentPieceCount === 1) return true;

			// King and minor piece vs King
			if ((currentPieceCount === 2 && opponentPieceCount === 1) ||
				(currentPieceCount === 1 && opponentPieceCount === 2)) {
				const hasOnlyKingAndMinor = (pieces: { [piece: string]: string[] }) => {
					return Object.keys(pieces).every(piece => 
						piece.toUpperCase() === 'K' || 
						piece.toUpperCase() === 'B' || 
						piece.toUpperCase() === 'N'
					);
				};
				return hasOnlyKingAndMinor(currentPieces) && hasOnlyKingAndMinor(opponentPieces);
			}

			// King and Bishop vs King and Bishop (same colored bishops)
			if (currentPieceCount === 2 && opponentPieceCount === 2) {
				const hasBishop = (pieces: { [piece: string]: string[] }) => {
					return Object.keys(pieces).some(piece => piece.toUpperCase() === 'B');
				};
				if (hasBishop(currentPieces) && hasBishop(opponentPieces)) {
					// Check if bishops are on same colored squares
					const getBishopSquareColor = (position: string) => {
						const file = position.charCodeAt(0) - 'a'.charCodeAt(0);
						const rank = parseInt(position[1]) - 1;
						return (file + rank) % 2 === 0;
					};
					const whiteBishopPos = currentPieces['B']?.[0] || opponentPieces['B']?.[0];
					const blackBishopPos = currentPieces['b']?.[0] || opponentPieces['b']?.[0];
					if (whiteBishopPos && blackBishopPos) {
						return getBishopSquareColor(whiteBishopPos) === getBishopSquareColor(blackBishopPos);
					}
				}
			}

			return false;
		})();

		if (isInsufficientMaterial) {
			return { isCheckmate: false, isDraw: true };
		}

		return { isCheckmate: false, isDraw: false };
	}

	// If in check and no legal moves, it's checkmate
	return { 
		isCheckmate: !hasAnyLegalMove,
		isDraw: false
	};
}

function hasLegalMoves(
	boardState: { [key: string]: string | null },
	whitesTurn: boolean,
	enPassantTarget: string | null,
	castlingStates: { white: { kingSide: boolean, queenSide: boolean }, black: { kingSide: boolean, queenSide: boolean } }
): boolean {
	// Get the pieces array for the current player
	const pieces = Object.entries(boardState).filter(([_, piece]) => 
		piece && (whitesTurn ? piece === piece.toUpperCase() : piece === piece.toLowerCase())
	);

	// Try all possible destination squares for each piece
	for (const [from, piece] of pieces) {
		// Optimize by using the actual chess board range (a-h, 1-8)
		for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
			const file = String.fromCharCode(97 + fileIdx); // 'a' to 'h'
			for (let rank = 1; rank <= 8; rank++) {
				const to = `${file}${rank}`;
				if (piece && isLegalMove(whitesTurn, piece, from, to, boardState, enPassantTarget, castlingStates)) {
					return true;
				}
			}
		}
	}
	return false;
}

export default pieceSprites;
