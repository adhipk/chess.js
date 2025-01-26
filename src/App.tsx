import './App.css'
import Board from './Components/Board';
export default function App(){
  return(
    <div className='page'>
      <Board size={600} lightColor='light-green' darkColor='dark-green'/>
    </div>
  );
}
