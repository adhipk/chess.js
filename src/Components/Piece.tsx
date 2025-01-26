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

const pieceSprites: { [key: string]:ReactElement } = {
	k: <KingDark className='piece'/>,
	q: <QueenDark className='piece'/>,
	r: <RookDark className='piece'/>,
	b: <BishopDark className='piece'/>,
	n: <KnightDark className='piece'/>,
	p: <PawnDark className='piece'/>,
	K: <KingLight className='piece'/>,
	Q: <QueenLight className='piece'/>,
	R: <RookLight className='piece'/>,
	B: <BishopLight className='piece'/>,
	N: <KnightLight className='piece'/>,
	P: <PawnLight className='piece'/>,
};
export default pieceSprites;