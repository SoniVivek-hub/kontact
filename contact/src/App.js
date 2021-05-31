import HomePage from "./components/HomePage";
import InputPagePlayers from "./components/InputPagePlayers";
import RoomPlayer from "./components/RoomPlayer";
import StartGame from "./components/StartGame";
import {io} from "socket.io-client"
const socket=io.connect("http://localhost:5000");

function App() {
  
  return (
    <div className="App">
      <HomePage socket={socket}/>
      <StartGame socket={socket} />
      <InputPagePlayers socket={socket} />
      <RoomPlayer socket={socket} />
      <InputPagePlayers socket={socket} />
    </div>
  );
}

export default App;
