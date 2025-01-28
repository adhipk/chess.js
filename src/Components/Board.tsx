import { useState, memo, useCallback, useMemo } from "react";
import pieceSprites, { isLegalMove,isCheckmate } from "./Piece";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";


interface SquareProps {
	isLightSquare: boolean;
	rank: string;
	file: string;
	piece: string | null;
}

interface PieceProps {
	pieceType: string;
	position: string;
}

const ranks = "12345678";
const files = "abcdefgh";

function parseFEN(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
	const initBoardState: { [position: string]: string | null } = {};
	const [piecePlacement] = fen.split(' ');
	const rows = piecePlacement.split('/');
	const initPieceState:{[color:string]:{[piece: string]: string[]}} = {'white':{},'black':{}};
	rows.forEach((row, rowIndex) => {
		let fileIndex = 0;
		for (const char of row) {
			if (isNaN(parseInt(char))) {
				const position = `${files[fileIndex]}${8-rowIndex}`;
				initBoardState[position] = char;
				const color = char === char.toUpperCase()? 'white' : 'black';
				if(initPieceState[color][char]){
					initPieceState[color][char].push(position);
				}else{
					initPieceState[color][char] = [position]
				}
				fileIndex++;
			} else {
				for (let i = 0; i < parseInt(char); i++) {
					const position = `${files[fileIndex]}${8-rowIndex}`;
					initBoardState[position] = null;
					fileIndex++;
				}
			}
		}
	});

	return {initBoardState,initPieceState};
}

const Piece = memo(({ pieceType, position }: PieceProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: pieceType + position,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        touchAction: 'none',
        zIndex: 1000
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
            {pieceSprites[pieceType]}
        </div>
    );
});

const Square = memo(({ isLightSquare, rank, file, piece }: SquareProps) => {
    const squareColor = isLightSquare ? `bg-[var(--color-light-green)]` : `bg-[var(--color-dark-green)]`;
    const position = `${file}${rank}`;
    const { setNodeRef } = useDroppable({
        id: position,
    });

    return (
        <div
            ref={setNodeRef}
            id={position}
            key={position}
            className={`flex-1 ${squareColor} relative`}
        >
            {piece && <Piece pieceType={piece} position={position} />}
        </div>
    );
});

export default function Board() {
	const {initBoardState,initPieceState} = parseFEN();
	const [boardState, setBoardState] = useState(initBoardState);
	const [pieceState, setPieceState] = useState(initPieceState);
	const [castlingStates, setCastlingStates] = useState({
		white: {
			kingSide: true,
			queenSide: true
		},
		black: {
			kingSide: true,
			queenSide: true
		}
	});
	const [enPassantTarget, setEnPassantTarget] = useState<string | null>(null);
	const [whitesTurn, setWhitesTurn] = useState(true);
	const [isGameOver, setIsGameOver] = useState(false);
	const [promotionSquare, setPromotionSquare] = useState<string | null>(null);
	const [pendingMove, setPendingMove] = useState<{from: string, to: string} | null>(null);
	const resetBoard = ()=>{
		// reset board and pieces to initial position, clear castling rights, en passant target, and turn
		setBoardState(initBoardState);
		setPieceState(initPieceState);
		setCastlingStates({
			white: { kingSide: true, queenSide: true },
			black: { kingSide: true, queenSide: true }
		});
		setEnPassantTarget(null);
		setWhitesTurn(true);
		setIsGameOver(false);
	}
	const handlePromotion = (promotedPiece: string) => {
		if (!pendingMove) return;
	
		const { from, to } = pendingMove;
		setBoardState(prev => {
			const newState = { ...prev };
			newState[to] = promotedPiece;
			newState[from] = null;
			return newState;
		});
	
		setPromotionSquare(null);
		setPendingMove(null);
		setWhitesTurn(!whitesTurn);
	};

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;
	
		const pieceId = active.id as string;
		const piece = pieceId.charAt(0);
		const fromPosition = pieceId.substring(pieceId.length - 2);
		const toPosition = over.id as string;
	
		if (fromPosition !== toPosition && isLegalMove(whitesTurn, piece, fromPosition, toPosition, boardState, enPassantTarget, castlingStates)) {
			// Check for pawn promotion
			if (piece.toUpperCase() === 'P' && (toPosition[1] === '8' || toPosition[1] === '1')) {
				setPromotionSquare(toPosition);
				setPendingMove({ from: fromPosition, to: toPosition });
				return;
			}
			setBoardState(prev => {
				const newState = { ...prev };
				newState[toPosition] = prev[fromPosition];
				newState[fromPosition] = null;
	
				// Handle en passant capture
				if (piece.toUpperCase() === 'P' && toPosition === enPassantTarget) {
					const capturedPawnRank = whitesTurn ? 5 : 4;
					const capturedPawnPosition = `${toPosition[0]}${capturedPawnRank}`;
					newState[capturedPawnPosition] = null;
				}
	
				// Handle castling rook movement
				if (piece.toUpperCase() === 'K') {
					const rank = whitesTurn ? '1' : '8';
					// Kingside castling
					if (fromPosition === `e${rank}` && toPosition === `g${rank}`) {
						newState[`f${rank}`] = newState[`h${rank}`];
						newState[`h${rank}`] = null;
					}
					// Queenside castling
					if (fromPosition === `e${rank}` && toPosition === `c${rank}`) {
						newState[`d${rank}`] = newState[`a${rank}`];
						newState[`a${rank}`] = null;
					}
				}
	
				return newState;
			});
	
			// Update pieceState to track piece positions
			setPieceState(prev => {
				const newPieceState = { ...prev };
				const color = whitesTurn ? 'white' : 'black';
				const opponentColor = whitesTurn ? 'black' : 'white';

				// Remove piece from old position
				Object.entries(newPieceState[color]).forEach(([pieceKey, positions]) => {
					newPieceState[color][pieceKey] = positions.filter(pos => pos !== fromPosition);
				});

				// Add piece to new position
				if (newPieceState[color][piece]) {
					newPieceState[color][piece].push(toPosition);
				} else {
					newPieceState[color][piece] = [toPosition];
				}

				// Handle captured pieces
				if (boardState[toPosition]) {
					Object.entries(newPieceState[opponentColor]).forEach(([pieceKey, positions]) => {
						newPieceState[opponentColor][pieceKey] = positions.filter(pos => pos !== toPosition);
					});
				}

				return newPieceState;
			});

			// Update castling rights
			setCastlingStates(prev => {
				const newState = { ...prev };
				if (whitesTurn) {
					if (piece === 'K') {
						newState.white.kingSide = false;
						newState.white.queenSide = false;
					} else if (piece === 'R') {
						if (fromPosition === 'h1') newState.white.kingSide = false;
						if (fromPosition === 'a1') newState.white.queenSide = false;
					}
				} else {
					if (piece === 'k') {
						newState.black.kingSide = false;
						newState.black.queenSide = false;
					} else if (piece === 'r') {
						if (fromPosition === 'h8') newState.black.kingSide = false;
						if (fromPosition === 'a8') newState.black.queenSide = false;
					}
				}
				return newState;
			});
	
			// Set en passant target if pawn moves two squares
			if (piece.toUpperCase() === 'P' && Math.abs(parseInt(toPosition[1]) - parseInt(fromPosition[1])) === 2) {
				const enPassantRank = whitesTurn ? 3 : 6;
				setEnPassantTarget(`${toPosition[0]}${enPassantRank}`);
			} else {
				setEnPassantTarget(null);
			}
	
			// Check for checkmate after the move
			const newBoardState = { ...boardState };
			newBoardState[toPosition] = newBoardState[fromPosition];
			newBoardState[fromPosition] = null;
			const checkmateResult = isCheckmate(newBoardState, !whitesTurn, enPassantTarget, castlingStates, pieceState);
			if (checkmateResult.isCheckmate || checkmateResult.isDraw) {
				setIsGameOver(true);
			}

			setWhitesTurn(!whitesTurn);
		}
	}, [whitesTurn, boardState, enPassantTarget, castlingStates]);

	const boardSquares = useMemo(() => {
		return ranks.split("").reverse().map((rank, rid) => (
			<div className="flex w-full h-[12.5%]" key={rank}>
				{files.split("").map((file, cid) => (
					<Square
						key={file + rank}
						rank={rank}
						file={file}
						isLightSquare={(rid + cid) % 2 === 0}
						piece={boardState[`${file}${rank}`]}
					/>
				))}
			</div>
		));
	}, [boardState]);

	return (
		<DndContext onDragEnd={handleDragEnd}>
			<div className={`flex flex-col`} style={{ width: `800px`, height: `800px` }}>
				{boardSquares}
			</div>
			{isGameOver && (
				<div className="absolute inset-0 flex items-center justify-center bg-transparent bg-opacity-50">
					<div className="bg-white p-4 rounded shadow">
						<h2 className="text-xl font-bold text-center text-black">
							Checkmate! {whitesTurn ? 'Black' : 'White'} wins!
						</h2>
						<button onClick={() => {
							resetBoard()
						}} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
							New Game?
						</button>
					</div>
				</div>
			)}
			{promotionSquare && (
				<dialog open className="fixed inset-0 z-50 bg-transparent">
					<div className="fixed inset-0 bg-opacity-50" aria-hidden="true" />
					<div className="fixed inset-0 flex items-center justify-center p-4">
						<div className="bg-white p-6 rounded-lg shadow-xl" role="dialog" aria-modal="true" aria-labelledby="promotion-title">
							<div className="flex gap-4">
								{[
									[whitesTurn ? 'Q' : 'q', 'Queen'],
									[whitesTurn ? 'R' : 'r', 'Rook'],
									[whitesTurn ? 'B' : 'b', 'Bishop'],
									[whitesTurn ? 'N' : 'n', 'Knight']
								].map(([piece, label]) => (
									<button
										key={piece}
										onClick={() => handlePromotion(piece)}
										className="p-4 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
										aria-label={`Promote to ${label}`}
									>
										<div className="w-16 h-16 flex items-center justify-center">
											{pieceSprites[piece]}
										</div>
									</button>
								))}
							</div>
						</div>
					</div>
				</dialog>
			)}
		</DndContext>
	);
}
