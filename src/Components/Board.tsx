import { useState } from "react";
import pieceSprites from "./Piece";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";

interface BoardProps {
	size: number;
	lightColor: string;
	darkColor: string;
}

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
	const state: { [position: string]: string | null } = {};
	const [piecePlacement] = fen.split(' ');
	const rows = piecePlacement.split('/');

	rows.forEach((row, rowIndex) => {
		let fileIndex = 0;
		for (const char of row) {
			if (isNaN(parseInt(char))) {
				const position = `${files[fileIndex]}${8 - rowIndex}`;
				state[position] = char;
				fileIndex++;
			} else {
				for (let i = 0; i < parseInt(char); i++) {
					const position = `${files[fileIndex]}${8 - rowIndex}`;
					state[position] = null;
					fileIndex++;
				}
			}
		}
	});

	return state;
}

const Piece = ({ pieceType, position }: PieceProps) => {
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
};

const Square = ({ isLightSquare, rank, file, piece }: SquareProps) => {
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
};

export default function Board({ size, lightColor, darkColor }: BoardProps) {
	const [boardState, setBoardState] = useState(parseFEN());

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;

		const pieceId = active.id as string;
		const fromPosition = pieceId.substring(pieceId.length - 2);
		const toPosition = over.id as string;

		if (fromPosition !== toPosition) {
			setBoardState(prev => {
				const newState = { ...prev };
				newState[toPosition] = prev[fromPosition];
				newState[fromPosition] = null;
				return newState;
			});
		}
	};

	return (
		<DndContext onDragEnd={handleDragEnd}>
			<div className={`flex flex-col`} style={{ width: `${size}px`, height: `${size}px` }}>
				{ranks.split("").map((rank, rid) => (
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
				))}
			</div>
		</DndContext>
	);
}
